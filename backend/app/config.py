"""
Centralized application settings.

Pydantic's BaseSettings reads from environment variables (and a .env file
in local development), so no secrets are hard-coded here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://dealership_user:dealership_pass@127.0.0.1:5433/dealership_db"
    jwt_secret_key: str = "1c15c277727d071f6efd2de2530bfa4436a48f1dfeb606cc156d2a11fd6bba3d"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Single shared settings instance imported throughout the app
settings = Settings()
