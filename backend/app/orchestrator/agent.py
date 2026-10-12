import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .prompts import AGRONOMIST_SYSTEM_PROMPT
from .tools import TOOL_DEFINITIONS, ToolExecutor
from .plot_memory import FarmPlotMemory, plot_memory_manager
from ..simulation.engine import SimulationEngine
from ..simulation.plant_registry import format_plant_database_for_prompt
from ..llm.base import BaseLLMProvider, LLMMessage, LLMResponse, ToolCall
from ..llm.factory import get_llm_provider

logger = logging.getLogger(__name__)


class AgentExecutionStep(BaseModel):
    step_num: int
    thought: Optional[str] = None
    tool_calls: List[Dict[str, Any]] = []
    tool_results: List[Dict[str, Any]] = []


class AgentResponse(BaseModel):
    final_response: str
    actions_taken: List[str]
    execution_steps: List[AgentExecutionStep]
    provider_used: str
    model_used: str


class AgricultureAgent:
    """Autonomous Multi-step Agent orchestrating between frontend user and Simulation Engine with Farm Plot Memory."""

    def __init__(
        self,
        engine: SimulationEngine,
        llm: Optional[BaseLLMProvider] = None,
        plot_memory: Optional[FarmPlotMemory] = None,
    ):
        self.engine = engine
        self.llm = llm or get_llm_provider()
        farm_id = getattr(engine.world, "farm_id", "default_farm")
        self.plot_memory = plot_memory or plot_memory_manager.get_memory(farm_id)
        self.executor = ToolExecutor(engine, plot_memory=self.plot_memory)

    async def run(
        self,
        user_prompt: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        max_steps: int = 5,
        frontend_farm_context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """Executes multi-step deliberation, tool invocation, and final response generation using Plot Memory."""
        # Use Farm Plot Memory to generate context selectively
        memory_context, was_full = self.plot_memory.generate_context_prompt(
            engine_summary=self.engine.get_summary(),
            world_tiles=self.engine.world.tiles,
            user_prompt=user_prompt,
            frontend_farm_context=frontend_farm_context,
            force_refresh=False,
        )
        context_prompt = (
            f"{AGRONOMIST_SYSTEM_PROMPT}\n\n"
            f"{memory_context}"
        )

        messages: List[LLMMessage] = [
            LLMMessage(role="system", content=context_prompt)
        ]

        if chat_history:
            for item in chat_history:
                messages.append(LLMMessage(role=item.get("role", "user"), content=item.get("content", "")))

        messages.append(LLMMessage(role="user", content=user_prompt))

        execution_steps: List[AgentExecutionStep] = []
        actions_taken: List[str] = []
        final_answer = ""
        last_provider = "unknown"
        last_model = "unknown"

        for step in range(1, max_steps + 1):
            llm_resp: LLMResponse = await self.llm.generate_response(
                messages=messages,
                tools=TOOL_DEFINITIONS,
                temperature=0.2,
            )
            last_provider = llm_resp.provider
            last_model = llm_resp.model

            step_record = AgentExecutionStep(
                step_num=step,
                thought=llm_resp.content,
                tool_calls=[],
                tool_results=[],
            )

            if not llm_resp.tool_calls:
                final_answer = llm_resp.content or "Completed analysis."
                execution_steps.append(step_record)
                break

            assistant_msg = LLMMessage(
                role="assistant",
                content=llm_resp.content,
                tool_calls=llm_resp.tool_calls,
            )
            messages.append(assistant_msg)

            for tc in llm_resp.tool_calls:
                step_record.tool_calls.append({"name": tc.name, "arguments": tc.arguments})
                action_desc = f"Executed {tc.name} with args {tc.arguments}"
                actions_taken.append(action_desc)

                tool_result = self.executor.execute(tc)
                step_record.tool_results.append(tool_result)

                messages.append(
                    LLMMessage(
                        role="tool",
                        name=tc.name,
                        tool_call_id=tc.id,
                        content=json.dumps(tool_result),
                    )
                )

            execution_steps.append(step_record)

        if not final_answer:
            final_answer = (
                f"Successfully executed {len(actions_taken)} farm operations. Current farm state updated."
            )

        return AgentResponse(
            final_response=final_answer,
            actions_taken=actions_taken,
            execution_steps=execution_steps,
            provider_used=last_provider,
            model_used=last_model,
        )
