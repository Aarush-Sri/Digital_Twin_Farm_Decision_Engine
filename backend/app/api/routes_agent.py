from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx
from ..storage.session_store import session_store
from ..orchestrator.agent import AgricultureAgent, AgentResponse
from ..llm.factory import get_llm_provider
from ..config import settings

router = APIRouter(prefix="/api/v1/agent", tags=["AI Orchestrator"])


class AgentChatRequest(BaseModel):
    prompt: str
    chat_history: Optional[List[Dict[str, str]]] = None
    max_steps: int = Field(default=5, ge=1, le=10)
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    model: Optional[str] = None
    preferred_provider: Optional[str] = "auto"  # "auto", "openai", "gemini", "ollama"
    frontend_farm_context: Optional[Dict[str, Any]] = None  # 2D Farm canvas topology & UI state
    enable_search: Optional[bool] = None  # Google Search Grounding toggle


class VerifyGeminiRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None
    test_all_models: bool = False


@router.post("/verify-gemini", response_model=Dict[str, Any])
async def verify_gemini(req: VerifyGeminiRequest):
    """Verifies a Gemini API key and tests latency across candidate models."""
    from ..llm.gemini_provider import GeminiProvider
    active_key = (req.api_key or settings.GEMINI_API_KEY or "").strip()
    provider = GeminiProvider(api_key=active_key, model=req.model or settings.GEMINI_MODEL)
    
    if req.test_all_models:
        results = await provider.test_multiple_models()
        all_valid = any(r.get("valid") for r in results)
        return {
            "valid": all_valid,
            "results": results,
            "supported_models": settings.SUPPORTED_GEMINI_MODELS,
            "message": "Model verification test complete." if all_valid else "Authentication or connection failed across tested models.",
        }
    
    result = await provider.verify_connection(model=req.model)
    return result


@router.get("/status", response_model=Dict[str, Any])
async def agent_status():
    """Returns availability and status of configured AI providers (OpenAI GPT, Gemini, Ollama Qwen, Fallback)."""
    ollama_tags = []
    ollama_reachable = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_reachable = True
                ollama_tags = [m.get("name") for m in resp.json().get("models", []) if m.get("name")]
    except Exception:
        ollama_reachable = False

    raw_gemini_key = (settings.GEMINI_API_KEY or "").strip()
    is_gemini_key_valid_format = raw_gemini_key.startswith("AIzaSy")

    return {
        "openai": {
            "configured": bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip()),
            "default_model": settings.OPENAI_MODEL,
        },
        "gemini": {
            "configured": bool(raw_gemini_key),
            "key_format_valid": is_gemini_key_valid_format,
            "default_model": settings.GEMINI_MODEL,
            "supported_models": settings.SUPPORTED_GEMINI_MODELS,
            "search_grounding": settings.ENABLE_GOOGLE_SEARCH,
        },
        "ollama": {
            "reachable": ollama_reachable,
            "base_url": settings.OLLAMA_BASE_URL,
            "default_model": settings.OLLAMA_MODEL,
            "installed_models": ollama_tags,
        },
        "fallback": {
            "rule_based_active": True,
            "engine": "agronomist-rule-v2",
        },
    }


@router.post("/{farm_id}/chat", response_model=AgentResponse)
async def agent_chat(farm_id: str, req: AgentChatRequest):
    """Sends a user prompt to the Autonomous Multi-Step AI Agent to inspect, advise, and operate on the farm."""
    engine = session_store.get_or_create_engine(farm_id=farm_id, name="GreenTwin Model Farm")

    model_str = (req.model or "").lower()
    is_openai_model = bool(any(x in model_str for x in ["gpt-", "o1-", "o3-", "chatgpt"]))
    is_gemini_model = bool("gemini" in model_str)

    effective_provider = req.preferred_provider
    if is_openai_model:
        effective_provider = "openai"
    elif is_gemini_model:
        effective_provider = "gemini"

    llm = get_llm_provider(
        gemini_api_key=req.gemini_api_key,
        gemini_model=req.model if (is_gemini_model or effective_provider == "gemini") else None,
        openai_api_key=req.openai_api_key,
        openai_model=req.openai_model or (req.model if (is_openai_model or effective_provider == "openai") else None),
        ollama_model=req.model if (not is_gemini_model and not is_openai_model and req.model) else None,
        preferred_provider=effective_provider,
        gemini_enable_search=req.enable_search,
    )

    agent = AgricultureAgent(engine=engine, llm=llm)
    response = await agent.run(
        user_prompt=req.prompt,
        chat_history=req.chat_history,
        max_steps=req.max_steps,
        frontend_farm_context=req.frontend_farm_context,
    )
    return response
