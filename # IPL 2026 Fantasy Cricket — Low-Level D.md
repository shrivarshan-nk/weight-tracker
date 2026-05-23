# IPL 2026 Fantasy Cricket — Low-Level Design (LLD) Context

> **Purpose:** This document is a comprehensive reference for any new chat window, new feature, or new collaborator. It captures the exact implementation patterns used in this project for Supabase (PostgreSQL), Alembic migrations, Google Auth, JWT, and the full domain model. Use this as the base for all future development.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Database | PostgreSQL via **Supabase** |
| ORM | SQLAlchemy (sync) |
| Migrations | Alembic |
| Auth | Google OAuth2 ID Token + JWT (python-jose) |
| WebSockets | FastAPI WebSocket (for live auction) |
| Frontend | React + Vite + Tailwind CSS |
| Deploy (frontend) | Vercel |
| Containerization | Docker (backend) |

---

## 2. Project Structure

```
backend/
├── alembic/                  # Migration tool config
│   ├── env.py                # DB URL + model registration
│   ├── versions/             # Migration scripts (chronological)
│   └── alembic.ini           # Script location (DB URL overridden in env.py)
├── app/
│   ├── main.py               # FastAPI app, CORS, routers
│   ├── database.py           # SQLAlchemy engine, SessionLocal, Base, get_db
│   ├── schemas.py            # (Pydantic schemas — currently minimal)
│   ├── core/
│   │   ├── config.py         # Settings loaded from .env via pydantic-settings
│   │   ├── deps.py           # get_current_user dependency (JWT decode)
│   │   ├── google_auth.py    # verify_google_token() using google-auth library
│   │   ├── jwt.py            # create_access_token() using python-jose
│   │   └── logger.py         # RotatingFileHandler logger factory
│   ├── models/
│   │   ├── user.py           # User (Google identity + password_hash optional)
│   │   ├── player.py         # IPL player roster
│   │   ├── squad.py          # squad_table (association table: user+league+player)
│   │   ├── league.py         # League + LeagueUser
│   │   ├── auction.py        # Auction (live bidding state)
│   │   ├── match.py          # Match, UserMatchTeam, MatchSelection, MatchPlayerStats
│   │   └── scorecard.py      # Scorecard (full inning data as JSON)
│   ├── routers/
│   │   ├── auth.py           # POST /auth/google
│   │   ├── players.py        # Player CRUD
│   │   ├── league.py         # Create/join/manage leagues
│   │   ├── auction.py        # Start/stop auction + WebSocket
│   │   ├── match.py          # Match management + team selection
│   │   └── user.py           # User profile endpoints
│   └── services/
│       ├── auction_ws.py     # WebSocket room manager + auction logic
│       ├── scoring_engine.py # Fantasy points calculation
│       └── scheduler_service.py # APScheduler for auto-tasks
└── requirements.txt
```

---

## 3. Environment Variables (`.env`)

All configuration lives in `backend/.env` (never committed to git).

```dotenv
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
SECRET_KEY=<random-secret>
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>.apps.googleusercontent.com
JWT_SECRET=<random-jwt-secret>
```

**How they are loaded:**
- `app/core/config.py` uses `pydantic-settings` `BaseSettings` with `env_file = ".env"`.
- `alembic/env.py` calls `dotenv.load_dotenv()` directly and reads `os.getenv("DATABASE_URL")`.

---

## 4. Database — Supabase (PostgreSQL)

### Connection Pattern

```python
# app/database.py
engine = create_engine(
    settings.DATABASE_URL,   # postgresql://... Supabase connection string
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True       # drops stale connections silently
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():           # FastAPI dependency — yields a session per request
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- **Supabase** acts as a managed PostgreSQL host. The `DATABASE_URL` is a standard `postgresql://` connection string (either direct or via Supabase's connection pooler).
- All models inherit from `Base = declarative_base()` in `database.py`.
- `get_db` is injected via `Depends(get_db)` in every router function.

---

## 5. Alembic (Database Migrations)

### How it is wired

| File | Purpose |
|---|---|
| `alembic.ini` | Points `script_location = alembic`. The `sqlalchemy.url` here is a placeholder — it is **overridden** in `env.py`. |
| `alembic/env.py` | Loads `.env`, sets the real `DATABASE_URL`, imports all models via `from app.models import *`, and points `target_metadata = Base.metadata`. |

### env.py key pattern

```python
# alembic/env.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
load_dotenv()
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

from app.database import Base
from app.models import *          # MUST import all models so metadata is populated

target_metadata = Base.metadata
```

> **Critical:** `from app.models import *` must import every model file. If a new model is not imported here, Alembic will not detect it during `autogenerate`.

### Migration Workflow

```bash
# From backend/ directory
alembic revision --autogenerate -m "describe_your_change"
alembic upgrade head
alembic downgrade -1          # roll back one step
alembic history               # view migration chain
```

### Migration Chain (chronological)

| Revision | Description |
|---|---|
| `d16ff8548417` | Initial schema — leagues, matches, players, users, auctions |
| `fantasy_cricket_init` | Fantasy cricket tables (user_match_teams, etc.) |
| `fix_squad_primary_key` | Composite PK on squads table |
| `add_league_to_squads` | league_id added to squads |
| `add_base_price_and_auction_mode` | base_price on players, auction_mode on leagues |
| `65faa4a1bb85` | owner_id + auction_status on leagues |
| `2f6d3a2d1e7d` | Google auth fields on users (email, name, picture, auth_provider) |
| `5e8f7a3b4c9d` | bowler_type sub-role support |
| `add_scorecard_and_player_stats` | Scorecard + MatchPlayerStats tables |
| `cricket_api_integration` | Cricket API model additions |

---

## 6. Google Auth Flow

### Overview

```
Frontend (React)
  └─ Google Sign-In button (uses @react-oauth/google or gsi client)
       └─ Returns a Google ID Token (JWT signed by Google)
            └─ POST /auth/google  { token: "<google-id-token>" }
                 └─ Backend verifies token with google-auth library
                      └─ Upsert User in DB
                           └─ Return app JWT
```

### Backend Implementation

**Step 1 — Verify Google Token** (`app/core/google_auth.py`)
```python
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.config import settings

def verify_google_token(token: str):
    return id_token.verify_oauth2_token(
        token,
        requests.Request(),
        settings.GOOGLE_CLIENT_ID,   # Must match the client ID used on frontend
    )
```
This calls Google's public key endpoint to cryptographically verify the token and returns the decoded payload (contains `email`, `name`, `picture`, `sub`).

**Step 2 — Upsert User + Issue App JWT** (`app/routers/auth.py`)
```python
@router.post("/auth/google")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    google_payload = verify_google_token(payload.token)  # raises on invalid
    email = google_payload["email"]

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=google_payload.get("name"),
            picture=google_payload.get("picture"),
            auth_provider="google",
        )
        db.add(user); db.commit(); db.refresh(user)

    jwt_token = create_access_token({"user_id": user.id})
    return {"access_token": jwt_token, "user": {...}}
```

**Step 3 — JWT Creation** (`app/core/jwt.py`)
```python
from jose import jwt

def create_access_token(data: dict, expires_minutes: int = 1440) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
```

**Step 4 — Auth Guard on Protected Routes** (`app/core/deps.py`)
```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token = Depends(oauth2_scheme), db = Depends(get_db)) -> User:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    return user
```
Usage in any router: `current_user: User = Depends(get_current_user)`.

---

## 7. Domain Model (Database Tables)

### Entity Relationship Summary

```
users ─────────────────── league_users ─── leagues
  │                              │               │
  │  (squads association)        │          (owner_id FK)
  └──── squads ──── players      │
                                 │
users ─── user_match_teams ─── matches ─── match_player_stats
                │                               │
           leagues                          players
                                               
matches ─── scorecards (1:1)
```

### Table Definitions

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | Auto-increment |
| email | String UNIQUE | Google email, indexed |
| name | String | From Google profile |
| picture | String | Google avatar URL |
| auth_provider | String | `"google"` (default) |
| password_hash | String NULLABLE | Reserved for future local auth |

#### `players`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String | Indexed |
| role | String | Batter, Bowler, All-Rounder, Wicket-Keeper, Spinner, Seamer |
| is_overseas | Boolean | |
| team | String | CSK, MI, RCB, etc. |
| base_price | Float | Default 20.0 (in Cr) |

#### `squads` (association table — 3-way)
| Column | Type | Notes |
|---|---|---|
| user_id | FK → users | Composite PK |
| league_id | FK → leagues | Composite PK |
| player_id | FK → players | Composite PK |
| purchase_price | Float | Price paid at auction |

#### `leagues`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| code | String UNIQUE | 6-char join code (e.g. `"A3F9C2"`) |
| owner_id | FK → users | Creator of league |
| max_players | Integer | Default 6 |
| budget | Float | Default 120 (Cr) |
| auction_started | Boolean | Default False |
| auction_status | String | `not_started` / `running` / `stopped` / `completed` |
| auction_mode | String | `timer_based` / `owner_based` / `both` |

#### `league_users`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| league_id | FK → leagues | |
| user_id | FK → users | |
| budget_remaining | Float | Decrements on each bid win |
| specialty_player_id | Integer NULLABLE | Selected specialty player |

#### `matches`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| team1 | String | |
| team2 | String | |
| match_date | DateTime | |
| closing_time | DateTime | 30 min before match — locks team selection |
| venue | String NULLABLE | |
| status | String | `upcoming` / `live` / `completed` |
| winner | String NULLABLE | |

#### `user_match_teams`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| user_id | FK → users | |
| league_id | FK → leagues | |
| match_id | FK → matches | |
| captain_player_id | FK → players | |
| selected_player_ids | JSON | List of player IDs |
| auto_picked | Boolean | Set if auto-mode triggered |
| submitted_at | DateTime | |

#### `match_player_stats`
| Column | Type | Notes |
|---|---|---|
| match_id | FK → matches | |
| player_id | FK → players | |
| played | Boolean | Did player actually play |
| runs, balls_faced, fours, sixes, strike_rate | Int/Float | Batting |
| wickets, overs_bowled, runs_conceded, dot_balls, economy_rate, maiden_overs | Int/Float | Bowling |
| catches, run_outs, stumpings | Integer | Fielding |

#### `scorecards`
| Column | Type | Notes |
|---|---|---|
| match_id | FK UNIQUE | 1:1 with matches |
| inning1_team / inning2_team | String | |
| inning1_runs / inning2_runs | Integer | |
| inning1_wickets / inning2_wickets | Integer | |
| inning1_overs / inning2_overs | Float | |
| winner, result_type, margin | String | |
| toss_winner, toss_decision | String | |
| man_of_match | String | |
| inning1_data / inning2_data | JSON | Full raw inning breakdown |

#### `auctions`
| Column | Type | Notes |
|---|---|---|
| league_id | FK → leagues | |
| player_id | FK → players | |
| current_bid | Float | |
| highest_bidder_id | FK → users | |
| status | String | `OPEN` / `SOLD` / `UNSOLD` |

---

## 8. API Routers

| Router | Prefix | Key Endpoints |
|---|---|---|
| `auth.py` | `/auth` | `POST /auth/google` |
| `players.py` | `/players` | GET list, player details |
| `league.py` | `/league` | `POST /create`, `POST /join`, GET details |
| `auction.py` | `/auction` | Start/stop/restart auction, WebSocket `/ws/{league_id}` |
| `match.py` | `/match` | Create match, submit team, auto-pick |
| `user.py` | `/user` | Profile, squad view |

---

## 9. Auction System (WebSocket)

- **`AuctionRoomManager`** in `services/auction_ws.py` manages per-league WebSocket rooms.
- Players connect to `ws://backend/auction/{league_id}/ws?token=<jwt>`.
- State machine: each room tracks current player on auction, active bids, timer.
- Auction modes:
  - `timer_based` — auto-advances on timer expiry.
  - `owner_based` — league owner manually calls next player.
  - `both` — either mechanism can advance.
- On bid win: `squads` table is updated, `budget_remaining` in `league_users` decremented.
- Squad constraints enforced: max overseas players (`MAX_OVERSEAS = 9`), role requirements (`SQUAD_REQUIREMENTS` dict).

---

## 10. Fantasy Scoring Engine

`services/scoring_engine.py` — `ScoringEngine` static class.

| Stat | Points |
|---|---|
| Each run | +1 |
| Each four | +1 bonus |
| Each six | +2 bonus |
| 25/35/50/70/100/125/150 run milestone | +2/3/5/7/10/15/20 |
| SR ≥ 150/175/200/225/250/275/300 | +2/3/5/7/10/15/20 |
| SR < 100 (Batter/WK/AR) | -5 |
| Duck (Batter/WK/AR) | -5 |
| Each wicket | +25 |
| 3W/4W/5W haul | bonus multiplier |
| Each catch/run-out/stumping | +8/8/10 |
| Maiden over | +4 |

---

## 11. Logging

`app/core/logger.py` — `get_logger(name)` factory.
- Outputs to **console** and **rotating file** (`logs/app.log`, 5 MB max, 5 backups).
- Request/response timing logged via HTTP middleware in `main.py`.

---

## 12. CORS Configuration

```python
allow_origins=[
    "http://localhost:5173",       # Vite dev server
    "http://127.0.0.1:5173",
    "https://ipl-2026-auction.vercel.app"   # Production frontend
]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

---

## 13. Patterns & Conventions

- **Every protected endpoint** uses `current_user: User = Depends(get_current_user)`.
- **DB session** injected as `db: Session = Depends(get_db)` — one session per request, auto-closed.
- **Models** all inherit from the same `Base` in `app/database.py`.
- **New model checklist:**
  1. Create `app/models/your_model.py` inheriting from `Base`.
  2. Import it in `app/models/__init__.py`.
  3. Run `alembic revision --autogenerate -m "add_your_model"` then `alembic upgrade head`.
- **New router checklist:**
  1. Create `app/routers/your_router.py`.
  2. Register it in `app/main.py` with `app.include_router(your_router.router, prefix="/your-prefix")`.

---

## 14. Running Locally

```bash
# From backend/
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, GOOGLE_CLIENT_ID, JWT_SECRET, SECRET_KEY
alembic upgrade head        # apply all migrations to Supabase
uvicorn app.main:app --reload --port 8000

# From frontend/
npm install
npm run dev                 # runs on http://localhost:5173
```

---

## 15. Key Dependencies

| Package | Version/Notes | Purpose |
|---|---|---|
| `fastapi` | latest | API framework |
| `uvicorn` | latest | ASGI server |
| `sqlalchemy` | latest | ORM |
| `psycopg2-binary` | latest | PostgreSQL driver |
| `alembic` | latest | DB migrations |
| `pydantic-settings` | latest | `.env` parsing |
| `python-dotenv` | latest | `.env` loading in alembic |
| `google-auth` | latest | Google token verification |
| `python-jose[cryptography]` | latest | JWT encode/decode |
| `passlib[bcrypt]` | latest | Password hashing (future use) |
| `websockets` | latest | WebSocket support |
| `apscheduler` | latest | Background job scheduling |
