import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from .base import BaseLLMProvider, LLMMessage, LLMResponse, ToolDefinition, ToolCall
from ..config import settings

logger = logging.getLogger(__name__)


class OllamaProvider(BaseLLMProvider):
    """Local Ollama Provider with OpenAI-compatible tool calling."""

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self._discovered_model = None

    async def _get_active_model(self, client: httpx.AsyncClient) -> str:
        if self._discovered_model:
            return self._discovered_model

        # Attempt to see if preferred model exists, or pick first installed model from /api/tags
        try:
            tags_resp = await client.get(f"{self.base_url}/api/tags", timeout=3.0)
            if tags_resp.status_code == 200:
                tags_data = tags_resp.json()
                models = [m.get("name") for m in tags_data.get("models", []) if m.get("name")]
                if self.model in models:
                    self._discovered_model = self.model
                elif models:
                    self._discovered_model = models[0]
                    logger.info(f"Using discovered Ollama model: {self._discovered_model}")
        except Exception as e:
            logger.debug(f"Could not discover Ollama tags: {e}")

        if not self._discovered_model:
            self._discovered_model = self.model or "llama3.2:1b"
        return self._discovered_model

    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        url = f"{self.base_url}/api/chat"

        async with httpx.AsyncClient(timeout=15.0) as client:
            active_model = await self._get_active_model(client)

            formatted_msgs = []
            for msg in messages:
                msg_dict: Dict[str, Any] = {"role": msg.role, "content": msg.content or ""}
                if msg.tool_calls:
                    msg_dict["tool_calls"] = [
                        {
                            "function": {
                                "name": tc.name,
                                "arguments": tc.arguments,
                            }
                        }
                        for tc in msg.tool_calls
                    ]
                formatted_msgs.append(msg_dict)

            payload: Dict[str, Any] = {
                "model": active_model,
                "messages": formatted_msgs,
                "stream": False,
                "options": {"temperature": temperature},
            }

            if tools:
                payload["tools"] = [
                    {
                        "type": "function",
                        "function": {
                            "name": t.name,
                            "description": t.description,
                            "parameters": t.parameters,
                        },
                    }
                    for t in tools
                ]

            try:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                # If tool-calling payload failed, retry with pure messages
                if tools:
                    payload.pop("tools", None)
                    resp = await client.post(url, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                else:
                    raise e

            message = data.get("message", {})
            content = message.get("content")
            raw_tool_calls = message.get("tool_calls", [])

            extracted_tool_calls: List[ToolCall] = []
            for tc in raw_tool_calls:
                func = tc.get("function", {})
                name = func.get("name", "")
                args = func.get("arguments", {})
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except Exception:
                        args = {}
                extracted_tool_calls.append(
                    ToolCall(
                        id=f"call_{name}",
                        name=name,
                        arguments=args,
                    )
                )

            return LLMResponse(
                content=content if content else None,
                tool_calls=extracted_tool_calls,
                provider="ollama",
                model=active_model,
            )
