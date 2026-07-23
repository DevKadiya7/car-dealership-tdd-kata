"""FastAPI application entry point. Run with:
    uvicorn app.main:app --reload
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.routers import auth, vehicles, purchase, customers
from app.routers.dashboard import router as dashboard_router

logger = logging.getLogger("uvicorn.error")

# Create tables on startup. In a real deployment this is normally replaced
# by running Alembic migrations instead, but this keeps local setup simple.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car Dealership Inventory API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # Comma-separated in CORS_ORIGINS (.env) - defaults to the local Vite
    # dev server. Add your frontend's real origin(s) when deploying.
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Without this, an unhandled exception bypasses CORSMiddleware entirely -
    # the browser then reports a *server crash* as a misleading "CORS error"
    # (no Access-Control-Allow-Origin header on the response), instead of
    # showing the actual 500. Catching it here keeps the response flowing
    # through the middleware stack normally, so the real error is visible in
    # the browser's network tab instead of hidden behind a CORS red herring.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(purchase.router)
app.include_router(dashboard_router)
app.include_router(customers.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
