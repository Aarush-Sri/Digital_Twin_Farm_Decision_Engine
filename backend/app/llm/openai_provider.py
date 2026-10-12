import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from .base import BaseLLMProvider, LLMMessage, LLMResponse, ToolDefinition, ToolCall
from ..config import settings

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """OpenAI GPT API Provider supporting models such as gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo."""

    DEFAULT_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "o1-mini", "o3-mini"]

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.api_key = api_key.strip() if api_key is not None else (settings.OPENAI_API_KEY or "").strip()
        self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"
        self.base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self._async_client = None

        if self.api_key:
            try:
                import openai
                self._async_client = openai.AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url,
                )
            except Exception as e:
                logger.debug(f"Could not initialize openai.AsyncOpenAI client, using httpx fallback: {e}")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        if not self.is_configured():
            raise ValueError("OPENAI_API_KEY is not configured.")

        # Format messages for OpenAI
        formatted_messages = []
        for msg in messages:
            msg_dict: Dict[str, Any] = {"role": msg.role}
            if msg.role == "tool":
                msg_dict["tool_call_id"] = msg.tool_call_id or "call_default"
                msg_dict["content"] = msg.content or ""
            elif msg.role == "assistant":
                msg_dict["content"] = msg.content
                if msg.tool_calls:
                    msg_dict["tool_calls"] = [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.name,
                                "arguments": json.dumps(tc.arguments) if isinstance(tc.arguments, dict) else str(tc.arguments),
                            },
                        }
                        for tc in msg.tool_calls
                    ]
            else:
                msg_dict["content"] = msg.content or ""
            formatted_messages.append(msg_dict)

        # Format tools if provided
        openai_tools = None
        if tools:
            openai_tools = [
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

        # 1. Try using the official AsyncOpenAI client if available
        if self._async_client:
            try:
                kwargs: Dict[str, Any] = {
                    "model": self.model,
                    "messages": formatted_messages,
                }
                # o1 / o3 models do not accept standard temperature
                if not (self.model.startswith("o1") or self.model.startswith("o3")):
                    kwargs["temperature"] = temperature

                if openai_tools:
                    kwargs["tools"] = openai_tools

                resp = await self._async_client.chat.completions.create(**kwargs)
                choice = resp.choices[0]
                message = choice.message

                extracted_tool_calls: List[ToolCall] = []
                if message.tool_calls:
                    for tc in message.tool_calls:
                        parsed_args = {}
                        if tc.function.arguments:
                            try:
                                parsed_args = json.loads(tc.function.arguments)
                            except Exception:
                                parsed_args = {"raw": tc.function.arguments}
                        extracted_tool_calls.append(
                            ToolCall(
                                id=tc.id,
                                name=tc.function.name,
                                arguments=parsed_args,
                            )
                        )

                return LLMResponse(
                    content=message.content if message.content else None,
                    tool_calls=extracted_tool_calls,
                    provider="openai",
                    model=self.model,
                    finish_reason=choice.finish_reason,
                )
            except Exception as e:
                logger.warning(f"AsyncOpenAI client error: {e}. Trying direct httpx request...")

        # 2. Resilient Direct HTTP fallback via httpx
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
        }
        if not (self.model.startswith("o1") or self.model.startswith("o3")):
            payload["temperature"] = temperature

        if openai_tools:
            payload["tools"] = openai_tools

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                err_text = resp.text
                try:
                    err_json = resp.json()
                    err_msg = err_json.get("error", {}).get("message", err_text)
                    err_code = err_json.get("error", {}).get("code")
                    if err_code == "credit_balance_exhausted" or "credit" in err_msg.lower() or "quota" in err_msg.lower():
                        raise RuntimeError(f"OpenAI Quota Exhausted: {err_msg}")
                    raise RuntimeError(f"OpenAI API Error ({resp.status_code}): {err_msg}")
                except (json.JSONDecodeError, KeyError):
                    resp.raise_for_status()

            data = resp.json()

            choice = data["choices"][0]
            message = choice["message"]

            extracted_tool_calls = []
            raw_tool_calls = message.get("tool_calls", [])
            for tc in raw_tool_calls:
                func = tc.get("function", {})
                raw_args = func.get("arguments", "{}")
                parsed_args = {}
                if isinstance(raw_args, str):
                    try:
                        parsed_args = json.loads(raw_args)
                    except Exception:
                        parsed_args = {"raw": raw_args}
                elif isinstance(raw_args, dict):
                    parsed_args = raw_args

                extracted_tool_calls.append(
                    ToolCall(
                        id=tc.get("id", f"call_{func.get('name', 'default')}"),
                        name=func.get("name", ""),
                        arguments=parsed_args,
                    )
                )

            return LLMResponse(
                content=message.get("content") or None,
                tool_calls=extracted_tool_calls,
                provider="openai",
                model=self.model,
                finish_reason=choice.get("finish_reason"),
            )
