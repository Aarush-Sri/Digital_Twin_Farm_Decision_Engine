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
    gemini_api_key: Optional[str] = None
    model: Optional[str] = None
    preferred_provider: Optional[str] = "auto"  # "auto", "gemini", "ollama"
    frontend_farm_context: Optional[Dict[str, Any]] = None  # 2D Farm canvas topology & UI state


@router.get("/status", response_model=Dict[str, Any])
async def agent_status():
    """Returns availability and status of configured AI providers (Gemini, Ollama Qwen, Fallback)."""
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

    return {
        "gemini": {
            "configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip()),
            "default_model": settings.GEMINI_MODEL,
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
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm session not found")

    is_gemini_model = bool(req.model and "gemini" in req.model.lower())
    llm = get_llm_provider(
        gemini_api_key=req.gemini_api_key,
        gemini_model=req.model if (is_gemini_model or req.preferred_provider == "gemini") else None,
        ollama_model=req.model if (not is_gemini_model and req.model) else None,
        preferred_provider="gemini" if is_gemini_model else req.preferred_provider,
    )

    agent = AgricultureAgent(engine=engine, llm=llm)
    response = await agent.run(
        user_prompt=req.prompt,
        chat_history=req.chat_history,
        max_steps=req.max_steps,
        frontend_farm_context=req.frontend_farm_context,
    )
    return response
