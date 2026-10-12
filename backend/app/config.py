from pathlib import Path
import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Search for .env in current directory, backend directory, or project root
_possible_env_paths = [
    Path.cwd() / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
]
for _p in _possible_env_paths:
    if _p.is_file():
        load_dotenv(_p, override=True)
        break
else:
    load_dotenv(override=True)



class Settings(BaseModel):
    # App
    APP_NAME: str = "AI Agriculture Simulation Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
    ENABLE_GOOGLE_SEARCH: bool = os.getenv("ENABLE_GOOGLE_SEARCH", "true").lower() == "true"
    SUPPORTED_GEMINI_MODELS: list[str] = [
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
    ]

    # OpenAI (GPT-4o, GPT-4o-mini)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

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
# reload
