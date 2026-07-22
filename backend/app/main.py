"""FastAPI application entry point. Run with:
    uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, vehicles, purchase
from app.routers.dashboard import router as dashboard_router

# Create tables on startup. In a real deployment this is normally replaced
# by running Alembic migrations instead, but this keeps local setup simple.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car Dealership Inventory API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(purchase.router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
