import json
import logging
from typing import List, Dict, Any, Optional
from .base import BaseLLMProvider, LLMMessage, LLMResponse, ToolDefinition, ToolCall
from ..config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini API Provider with function calling support."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")

    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        if not self._client:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)

        from google.genai import types

        contents = []
        system_instruction = None

        gemini_tools = None
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
            gemini_tools = [types.Tool(function_declarations=function_declarations)]

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
                        parts.append(
                            types.Part.from_function_call(
                                name=tc.name,
                                args=tc.arguments,
                            )
                        )
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
            tools=gemini_tools,
            system_instruction=system_instruction,
        )

        response = self._client.models.generate_content(
            model=self.model,
            contents=contents,
            config=config,
        )

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
                            )
                        )
                    elif part.text:
                        text_content += part.text

        return LLMResponse(
            content=text_content if text_content else None,
            tool_calls=extracted_tool_calls,
            provider="gemini",
            model=self.model,
        )
