# Weight Tracker App — Build Plan

## Overview

A personal weight tracking web app with Google Auth, a weight chart, and a calendar-style log. Built on the same stack as the IPL app (FastAPI + Supabase + SQLAlchemy + Alembic + React + Vite). Frontend uses **Material UI** instead of Tailwind. The DB is designed to be extensible — a future `food_logs` table can plug in with zero changes to `users` or `weight_logs`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| ORM | SQLAlchemy (sync) |
| Migrations | Alembic |
| Auth | Google OAuth2 ID Token + JWT (python-jose) |
| Frontend | React + Vite + **Material UI (MUI v6)** |
| Charts | **Recharts** (lightweight, React-native) |
| Deploy (frontend) | Vercel |

---

## Project Structure

```
weight-tracker/
├── backend/
│   ├── alembic/
│   │   ├── env.py
│   │   ├── versions/
│   │   └── alembic.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── deps.py
│   │   │   ├── google_auth.py
│   │   │   ├── jwt.py
│   │   │   └── logger.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py          # Shared users table
│   │   │   └── health_log.py    # weight_logs (+ future food_logs same pattern)
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   └── weight.py        # CRUD for weight entries
│   │   └── schemas/
│   │       ├── weight.py        # Pydantic request/response models
│   │       └── user.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api/
    │   │   ├── axiosClient.ts   # Axios instance with JWT header
    │   │   └── weightApi.ts     # All /weight endpoint calls
    │   ├── auth/
    │   │   ├── AuthContext.tsx  # Google login state + JWT storage
    │   │   └── LoginPage.tsx
    │   ├── components/
    │   │   ├── WeightChart/
    │   │   │   ├── WeightChart.tsx        # Recharts line chart
    │   │   │   └── DurationSelector.tsx   # MUI Select for 1W/1M/3M/6M/1Y
    │   │   ├── WeightCalendar/
    │   │   │   ├── WeightCalendar.tsx     # Calendar grid container
    │   │   │   ├── DayCard.tsx            # Single day card with entries
    │   │   │   └── EntryRow.tsx           # Single entry with Edit/Delete icons
    │   │   └── WeightDialog/
    │   │       ├── AddWeightDialog.tsx    # MUI Dialog for new entry
    │   │       └── EditWeightDialog.tsx   # MUI Dialog for editing
    │   ├── hooks/
    │   │   └── useWeightData.ts   # Custom hook: fetch + cache + optimistic updates
    │   ├── pages/
    │   │   └── DashboardPage.tsx  # Assembles chart + calendar + FAB
    │   └── theme/
    │       └── theme.ts           # MUI theme customization
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Database Schema

### `users` (reused as-is from IPL LLD)

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | Auto-increment |
| email | String UNIQUE | Google email |
| name | String | From Google profile |
| picture | String | Avatar URL |
| auth_provider | String | `"google"` |
| password_hash | String NULLABLE | Reserved |

### `weight_logs` (new table)

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| user_id | FK → users | Indexed |
| weight_kg | Float | The recorded weight |
| logged_at | DateTime (with tz) | Exact timestamp of the entry |
| note | String NULLABLE | Optional free-text note |
| created_at | DateTime | Server-set on insert |
| updated_at | DateTime | Server-set on update |

**Extensibility note:** A future `food_logs` table follows the same pattern — `id`, `user_id`, `logged_at`, `calories`, `protein_g`, etc. The `users` table never changes.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/google` | Public | Google token → app JWT |
| GET | `/weight` | JWT | List entries (query params: `from`, `to`) |
| POST | `/weight` | JWT | Create new entry |
| PATCH | `/weight/{id}` | JWT | Edit entry (weight_kg, logged_at, note) |
| DELETE | `/weight/{id}` | JWT | Delete entry |

All `/weight` endpoints enforce `user_id == current_user.id` — users can only touch their own data.

---

## Frontend UI Breakdown

### DashboardPage layout

```
┌─────────────────────────────────────────────┐
│  Weight Tracker               [+ Log Weight] │  ← AppBar with FAB/Button top-right
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │  WeightChart (Recharts line graph)    │  │
│  │  default: last 7 days                 │  │
│  └───────────────────────────────────────┘  │
│  [ Duration: 1 Week ▼ ]  ← MUI Select       │
├─────────────────────────────────────────────┤
│  WeightCalendar                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ Mon 19  │  │ Tue 20  │  │ Wed 21  │ ... │
│  │ 78.2 kg │  │ 77.9 kg │  │ (none)  │     │
│  │ 08:32   │  │ 07:15   │  │         │     │
│  │ ✏️  🗑️  │  │ ✏️  🗑️  │  │         │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Props | Notes |
|---|---|---|
| `WeightChart` | `entries[]`, `from`, `to` | Recharts `<LineChart>`. Tooltip shows date + kg. |
| `DurationSelector` | `value`, `onChange` | MUI `<Select>`. Options: 1W / 1M / 3M / 6M / 1Y |
| `WeightCalendar` | `entries[]`, `onEdit`, `onDelete` | Maps days in range → `DayCard` |
| `DayCard` | `date`, `entries[]`, `onEdit`, `onDelete` | MUI `<Card>`. Multiple entries per day supported. |
| `EntryRow` | `entry`, `onEdit`, `onDelete` | Shows time + kg + icon buttons |
| `AddWeightDialog` | `open`, `onClose`, `onSave` | MUI `<Dialog>` with DateTimePicker + number field |
| `EditWeightDialog` | `open`, `entry`, `onClose`, `onSave` | Pre-fills existing values |
| `useWeightData` hook | — | `fetchEntries(from, to)`, `addEntry()`, `editEntry()`, `deleteEntry()` with optimistic UI |

---

## Build Order (Step-by-Step)

### Phase 1 — Backend

1. Scaffold `backend/` directory (copy core infra from IPL LLD: `database.py`, `config.py`, `deps.py`, `google_auth.py`, `jwt.py`, `logger.py`)
2. Create `app/models/user.py` (identical to IPL users table)
3. Create `app/models/health_log.py` → `WeightLog` model
4. Create `app/models/__init__.py` exporting both models
5. Wire `alembic/env.py` with the new models
6. Run `alembic revision --autogenerate -m "initial_weight_tracker"` + `alembic upgrade head`
7. Create `app/schemas/weight.py` (Pydantic `WeightLogCreate`, `WeightLogUpdate`, `WeightLogOut`)
8. Create `app/routers/auth.py` (POST /auth/google — same as IPL)
9. Create `app/routers/weight.py` (GET / POST / PATCH / DELETE)
10. Wire routers in `app/main.py` with CORS

### Phase 2 — Frontend Scaffold

11. `npm create vite@latest frontend -- --template react-ts`
12. Install: `@mui/material @emotion/react @emotion/styled @mui/x-date-pickers recharts axios @react-oauth/google`
13. Create `src/theme/theme.ts`
14. Set up `AuthContext` + `LoginPage` with Google Sign-In button
15. Set up `axiosClient.ts` with JWT bearer token interceptor

### Phase 3 — Frontend Feature Components

16. Build `useWeightData` hook (API calls + local state)
17. Build `DurationSelector` component
18. Build `WeightChart` component
19. Build `EntryRow` → `DayCard` → `WeightCalendar`
20. Build `AddWeightDialog` + `EditWeightDialog`
21. Assemble `DashboardPage` with AppBar + FAB

### Phase 4 — Polish & Deploy

22. Add loading skeletons (MUI `<Skeleton>`)
23. Add empty state (no entries yet)
24. Add error snackbar (MUI `<Snackbar>`)
25. Vercel deploy for frontend, Docker/Railway for backend

---

## Future Extensibility — Food Tracker

When you want to add food logging, the only changes are:

1. Add `app/models/food_log.py` → `FoodLog` model (`user_id`, `logged_at`, `meal_type`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `description`)
2. Add `app/routers/food.py`
3. Register the router in `main.py`
4. New Alembic migration
5. New frontend page/components

The `users` table, auth flow, `database.py`, and all core infrastructure remain **untouched**.

---

## Environment Variables

```dotenv
# backend/.env
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
SECRET_KEY=<random>
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
JWT_SECRET=<random>
```

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
```

---

## Key Dependencies

### Backend
| Package | Purpose |
|---|---|
| `fastapi` | API framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` | ORM |
| `psycopg2-binary` | PostgreSQL driver |
| `alembic` | Migrations |
| `pydantic-settings` | `.env` parsing |
| `python-dotenv` | `.env` in Alembic |
| `google-auth` | Verify Google tokens |
| `python-jose[cryptography]` | JWT |

### Frontend
| Package | Purpose |
|---|---|
| `@mui/material` | UI components |
| `@mui/x-date-pickers` | DateTimePicker for log dialog |
| `recharts` | Weight chart |
| `axios` | HTTP client |
| `@react-oauth/google` | Google Sign-In button |

---

## Next Step

Reply "let's build" and we'll start with **Phase 1** — scaffolding the backend, creating the models, running the first Alembic migration, and wiring the weight CRUD router.
