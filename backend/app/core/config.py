import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Pottery Class App"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pottery_app.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_changed")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # 30 minutes
    UPLOADS_DIR: str = "backend/app/uploads/images" # Relative to project root

settings = Settings()