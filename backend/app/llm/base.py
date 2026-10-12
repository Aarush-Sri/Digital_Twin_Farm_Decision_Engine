from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]


class ToolCall(BaseModel):
    id: str = Field(default_factory=lambda: "call_default")
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    thought_signature: Optional[Any] = None


class LLMMessage(BaseModel):
    role: str  # "system", "user", "assistant", "tool"
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None


class LLMResponse(BaseModel):
    content: Optional[str] = None
    tool_calls: List[ToolCall] = Field(default_factory=list)
    provider: str
    model: str
    finish_reason: Optional[str] = None


class BaseLLMProvider(ABC):
    """Abstract interface for LLM Providers."""

    @abstractmethod
    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        pass
