"""
App-wide configuration loaded from environment variables.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Steel Trader API"
    version: str = "1.0.0"
    database_url: str = "sqlite:///./steel_trader.db"

    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "CHANGE-THIS-IN-PRODUCTION-USE-A-LONG-RANDOM-STRING")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
