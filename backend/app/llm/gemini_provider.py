import json
import logging
from typing import List, Dict, Any, Optional
from .base import BaseLLMProvider, LLMMessage, LLMResponse, ToolDefinition, ToolCall
from ..config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API Provider with function calling and search grounding support."""

    FALLBACK_MODELS = [
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
    ]

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        enable_search: Optional[bool] = None,
    ):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self.enable_search = enable_search if enable_search is not None else settings.ENABLE_GOOGLE_SEARCH
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def verify_connection(
        self,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Lightweight probe to test whether API key and selected model are valid and reachable."""
        target_model = model or self.model
        if not self.is_configured():
            return {
                "valid": False,
                "error_type": "missing_key",
                "message": "Gemini API key is not configured. Provide an API key starting with 'AIzaSy...'.",
                "model": target_model,
                "supported_models": settings.SUPPORTED_GEMINI_MODELS,
            }

        import time
        start_time = time.time()

        try:
            if not self._client:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)

            res = self._client.models.generate_content(
                model=target_model,
                contents="Respond with 'OK'",
            )
            latency_ms = int((time.time() - start_time) * 1000)
            reply_preview = res.text.strip() if res.text else "OK"
            return {
                "valid": True,
                "model": target_model,
                "latency_ms": latency_ms,
                "message": f"Successfully connected to Google Gemini ({target_model}) in {latency_ms}ms.",
                "reply_preview": reply_preview,
                "supported_models": settings.SUPPORTED_GEMINI_MODELS,
            }
        except Exception as e:
            err_str = str(e)
            latency_ms = int((time.time() - start_time) * 1000)
            if "401" in err_str or "UNAUTHENTICATED" in err_str or "ACCESS_TOKEN_TYPE_UNSUPPORTED" in err_str:
                return {
                    "valid": False,
                    "error_type": "unauthenticated",
                    "message": "Invalid API key (HTTP 401). Google AI Studio keys start with 'AIzaSy...'. Get one free at https://aistudio.google.com/app/apikey",
                    "model": target_model,
                    "latency_ms": latency_ms,
                    "supported_models": settings.SUPPORTED_GEMINI_MODELS,
                }
            elif "404" in err_str or "NOT_FOUND" in err_str or "not found" in err_str.lower():
                return {
                    "valid": False,
                    "error_type": "model_not_found",
                    "message": f"Model '{target_model}' was not found. Try 'gemini-2.0-flash' or 'gemini-1.5-flash'.",
                    "model": target_model,
                    "latency_ms": latency_ms,
                    "supported_models": settings.SUPPORTED_GEMINI_MODELS,
                }
            elif "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                return {
                    "valid": False,
                    "error_type": "rate_limited",
                    "message": f"Gemini quota exceeded or rate limit reached (HTTP 429) for model '{target_model}'.",
                    "model": target_model,
                    "latency_ms": latency_ms,
                    "supported_models": settings.SUPPORTED_GEMINI_MODELS,
                }
            else:
                return {
                    "valid": False,
                    "error_type": "general_error",
                    "message": f"Gemini connection failed: {err_str}",
                    "model": target_model,
                    "latency_ms": latency_ms,
                    "supported_models": settings.SUPPORTED_GEMINI_MODELS,
                }

    async def test_multiple_models(
        self,
        models: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Tests multiple models to check availability and compare latency across different models."""
        target_models = models or settings.SUPPORTED_GEMINI_MODELS
        results = []
        for m in target_models:
            res = await self.verify_connection(model=m)
            results.append(res)
        return results

    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        if not self.is_configured():
            raise ValueError("GEMINI_API_KEY is not configured.")

        if not self._client:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)

        from google.genai import types

        contents = []
        system_instruction = None

        gemini_tools = []
        if tools:
            function_declarations = []
            for t in tools:
                function_declarations.append(
                    types.FunctionDeclaration(
                        name=t.name,
                        description=t.description,
                        parameters=t.parameters,
                    )
                )
            gemini_tools.append(types.Tool(function_declarations=function_declarations))
        elif self.enable_search:
            # Add Google Search grounding when no custom simulation function tools are active
            try:
                gemini_tools.append(types.Tool(google_search=types.GoogleSearch()))
            except Exception as e:
                logger.debug(f"Could not attach Google Search tool: {e}")

        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
            elif msg.role == "user":
                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=msg.content or "")]))
            elif msg.role == "assistant":
                parts = []
                if msg.content:
                    parts.append(types.Part.from_text(text=msg.content))
                if msg.tool_calls:
                    for tc in msg.tool_calls:
                        p = types.Part.from_function_call(
                            name=tc.name,
                            args=tc.arguments,
                        )
                        if getattr(tc, "thought_signature", None):
                            p.thought_signature = tc.thought_signature
                        parts.append(p)
                contents.append(types.Content(role="model", parts=parts))
            elif msg.role == "tool":
                response_data = {}
                try:
                    response_data = json.loads(msg.content or "{}")
                except Exception:
                    response_data = {"output": msg.content}

                parts = [
                    types.Part.from_function_response(
                        name=msg.name or "tool",
                        response={"result": response_data},
                    )
                ]
                contents.append(types.Content(role="user", parts=parts))

        config = types.GenerateContentConfig(
            temperature=temperature,
            tools=gemini_tools if gemini_tools else None,
            system_instruction=system_instruction,
        )

        # Attempt with configured model, then fallback models if model is not recognized
        candidate_models = [self.model]
        for m in self.FALLBACK_MODELS:
            if m not in candidate_models:
                candidate_models.append(m)

        last_err = None
        response = None
        used_model = self.model

        for target_model in candidate_models:
            try:
                response = self._client.models.generate_content(
                    model=target_model,
                    contents=contents,
                    config=config,
                )
                used_model = target_model
                break
            except Exception as e:
                last_err = e
                err_str = str(e)
                # Fail fast immediately on authentication errors
                if "401" in err_str or "UNAUTHENTICATED" in err_str or "ACCESS_TOKEN_TYPE_UNSUPPORTED" in err_str:
                    raise ValueError(
                        "Invalid Gemini API Key: Request returned HTTP 401 UNAUTHENTICATED. "
                        "Please verify your Google AI Studio API key (starts with 'AIzaSy...') at https://aistudio.google.com/app/apikey"
                    ) from e
                logger.warning(f"Gemini call with model '{target_model}' failed: {e}. Trying fallback if available...")

        if response is None:
            raise last_err or RuntimeError("Failed to generate response with Gemini")

        extracted_tool_calls: List[ToolCall] = []
        text_content = ""

        if response.candidates:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.function_call:
                        fc = part.function_call
                        args = dict(fc.args) if fc.args else {}
                        extracted_tool_calls.append(
                            ToolCall(
                                id=f"call_{fc.name}",
                                name=fc.name,
                                arguments=args,
                                thought_signature=getattr(part, "thought_signature", None),
                            )
                        )
                    elif part.text:
                        text_content += part.text

        return LLMResponse(
            content=text_content if text_content else None,
            tool_calls=extracted_tool_calls,
            provider="gemini",
            model=used_model,
        )
