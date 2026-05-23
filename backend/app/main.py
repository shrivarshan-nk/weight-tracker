import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.logger import get_logger
from app.routers import auth, weight

logger = get_logger("main")

app = FastAPI(title="Weight Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://weight-tracker-976571215968.asia-south1.run.app",  # Cloud Run (self, for health checks)
        # Add your Vercel URL here once deployed, e.g.:
        # "https://weight-tracker-xxx.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration:.1f}ms)"
    )
    return response


app.include_router(auth.router)
app.include_router(weight.router)


@app.get("/health")
def health():
    return {"status": "ok"}
