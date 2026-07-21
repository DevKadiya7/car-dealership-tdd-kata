from fastapi import FastAPI
from app.routers import auth, vehicles

app = FastAPI(title="Car Dealership Inventory System")
app.include_router(auth.router)
app.include_router(vehicles.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
