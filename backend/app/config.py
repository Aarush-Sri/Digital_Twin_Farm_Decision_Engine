import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    # App
    APP_NAME: str = "AI Agriculture Simulation Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    ENABLE_GOOGLE_SEARCH: bool = os.getenv("ENABLE_GOOGLE_SEARCH", "true").lower() == "true"

    # Ollama Fallback (Default to Qwen 3.5 / 2.5)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3.5")

    # Simulation Defaults
    DEFAULT_GRID_WIDTH: int = 10
    DEFAULT_GRID_HEIGHT: int = 10
    DEFAULT_INITIAL_MOISTURE: float = 65.0  # %
    DEFAULT_SUN_HOURS: float = 12.0
    DEFAULT_BASE_TEMPERATURE: float = 24.0  # °C

    # Storage
    DATA_DIR: str = os.getenv("DATA_DIR", "./data_snapshots")


settings = Settings()
