from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..storage.session_store import session_store
from ..orchestrator.agent import AgricultureAgent, AgentResponse

router = APIRouter(prefix="/api/v1/agent", tags=["AI Orchestrator"])


class AgentChatRequest(BaseModel):
    prompt: str
    chat_history: Optional[List[Dict[str, str]]] = None
    max_steps: int = 5


@router.post("/{farm_id}/chat", response_model=AgentResponse)
async def agent_chat(farm_id: str, req: AgentChatRequest):
    """Sends a user prompt to the Autonomous Multi-Step AI Agent to inspect, advise, and operate on the farm."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm session not found")

    agent = AgricultureAgent(engine=engine)
    response = await agent.run(
        user_prompt=req.prompt,
        chat_history=req.chat_history,
        max_steps=req.max_steps,
    )
    return response
