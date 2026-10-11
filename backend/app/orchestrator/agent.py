import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .prompts import AGRONOMIST_SYSTEM_PROMPT
from .tools import TOOL_DEFINITIONS, ToolExecutor
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
    """Autonomous Multi-step Agent orchestrating between frontend user and Simulation Engine."""

    def __init__(self, engine: SimulationEngine, llm: Optional[BaseLLMProvider] = None):
        self.engine = engine
        self.llm = llm or get_llm_provider()
        self.executor = ToolExecutor(engine)

    async def run(
        self,
        user_prompt: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        max_steps: int = 5,
        frontend_farm_context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """Executes multi-step deliberation, tool invocation, and final response generation."""
        # If simulation tiles are unpopulated but frontend items are provided, auto-sync layout
        raw_items = []
        if frontend_farm_context:
            raw_items = frontend_farm_context.get("items_raw") or frontend_farm_context.get("items") or []
            if not raw_items and frontend_farm_context.get("items_2d"):
                raw_items = [
                    {
                        "type": it.get("type"),
                        "x": int(float(it.get("x_m", 0)) * 40),
                        "y": int(float(it.get("y_m", 0)) * 40),
                        "width": int(float(it.get("width_m", 1)) * 40),
                        "height": int(float(it.get("height_m", 1)) * 40),
                    }
                    for it in frontend_farm_context.get("items_2d", [])
                ]
        if raw_items and not any(t.crop for t in self.engine.world.tiles):
            self.engine.sync_from_frontend(
                items=raw_items,
                farm_settings=frontend_farm_context.get("farm_settings"),
                farm_profile=frontend_farm_context.get("farm_profile"),
            )

        farm_summary = self.engine.get_summary()

        crop_tiles_desc = []
        tree_tiles_desc = []
        irrigation_desc = []
        fallow_count = 0
        for tile in self.engine.world.tiles:
            if tile.crop:
                desc = f"Tile ({tile.x},{tile.y}): {tile.crop.crop_type.value} [Stage={tile.crop.current_stage.value}, Health={tile.crop.health_pct:.0f}%, Soil Moisture={tile.soil.moisture_pct:.1f}%]"
                if "tree" in tile.crop.crop_type.value:
                    tree_tiles_desc.append(desc)
                else:
                    crop_tiles_desc.append(desc)
            elif tile.irrigation_type.value != "none":
                irrigation_desc.append(
                    f"Tile ({tile.x},{tile.y}): Irrigation {tile.irrigation_type.value} @ {tile.irrigation_rate_mm_per_day}mm/day [Moisture={tile.soil.moisture_pct:.1f}%]"
                )
            else:
                fallow_count += 1

        cultivated_summary = f"- Cultivated Crop Plots ({len(crop_tiles_desc)} tiles):\n  " + (
            "\n  ".join(crop_tiles_desc[:32]) if crop_tiles_desc else "No field crops planted in simulation grid"
        )
        tree_summary = f"- Orchard & Agroforestry Trees ({len(tree_tiles_desc)} tiles):\n  " + (
            "\n  ".join(tree_tiles_desc[:16]) if tree_tiles_desc else "No trees planted in simulation grid"
        )
        irr_summary = f"- Active Irrigation Channels ({len(irrigation_desc)} tiles):\n  " + (
            "\n  ".join(irrigation_desc[:16]) if irrigation_desc else "No active irrigation channels"
        )
        plot_detail = f"{cultivated_summary}\n{tree_summary}\n{irr_summary}\n- Fallow/Open Turf: {fallow_count} tiles"

        frontend_context_desc = ""
        items_source = (frontend_farm_context.get("items_2d", []) if frontend_farm_context else []) or [
            {
                "type": it.get("type"),
                "x_m": round(it.get("x", 0) / 40.0, 2),
                "y_m": round(it.get("y", 0) / 40.0, 2),
                "width_m": round(it.get("width", 40) / 40.0, 2),
                "height_m": round(it.get("height", 40) / 40.0, 2),
                "category": it.get("category", "Asset"),
            }
            for it in self.engine.world.canvas_items
        ]

        if items_source or frontend_farm_context:
            ui_patch = (frontend_farm_context or {}).get("ui_patch_details", {})
            active_mod = (frontend_farm_context or {}).get("active_model", {})
            farm_settings = (frontend_farm_context or {}).get("farm_settings", {}) or self.engine.world.canvas_settings

            item_lines = []
            for it in items_source:
                cat = it.get("category") or "Item"
                line = f"• [{cat}] '{it.get('type')}' at ({it.get('x_m')}m, {it.get('y_m')}m), size {it.get('width_m')}m×{it.get('height_m')}m"
                if it.get("nearest_water_dist_m") is not None:
                    line += f", water dist: {it.get('nearest_water_dist_m')}m"
                item_lines.append(line)

            selected_sc = ui_patch.get("selected_scenario")
            sc_info = "None"
            if selected_sc:
                sc_info = f"{selected_sc.get('title')} ({selected_sc.get('subtitle')}) - Yield Impact: {selected_sc.get('yieldDelta', 'N/A')}, Water: {selected_sc.get('waterDemand', 'N/A')}"

            boundary_str = f"{farm_settings.get('boundaryWidthM', 100)}m × {farm_settings.get('boundaryHeightM', 100)}m ({farm_settings.get('totalSize', 2.5)} {farm_settings.get('unit', 'acres')})"

            frontend_context_desc = (
                f"\n=== 2D VISUAL FARM CANVAS & SPATIAL TOPOLOGY ===\n"
                f"- Farm Boundary: {boundary_str}\n"
                f"- Active AI Model: {active_mod.get('label', 'Default')} ({active_mod.get('provider', 'N/A')})\n"
                f"- UI Active Tab: {ui_patch.get('active_tab', 'chat')}\n"
                f"- Active Simulation Scenario: {sc_info}\n"
                f"- Placed 2D Canvas Items ({len(items_source)} total items):\n"
                f"  " + ("\n  ".join(item_lines) if item_lines else "None") + "\n"
            )

        prof = self.engine.world.profile
        profile_desc = (
            f"- Location & Topography: {prof.location_name}, {prof.country} | Lat: {prof.latitude_deg}°, Elev: {prof.elevation_m}m, Slope: {prof.slope_pct}%\n"
            f"- Soil Profile: Texture: {prof.soil_texture.value.upper()}, Organic Matter: {prof.organic_matter_pct}%, pH: {prof.baseline_ph}, N-P-K: {prof.baseline_nitrogen_ppm}-{prof.baseline_phosphorus_ppm}-{prof.baseline_potassium_ppm} ppm, Salinity: {prof.soil_salinity_ec_ds_m} dS/m\n"
            f"- Water Infrastructure: {prof.water_source} | Reserve: {prof.current_reserve_m3} m³ / {prof.storage_capacity_m3} m³ (${prof.water_cost_per_m3}/m³)\n"
            f"- Farming System: {prof.farming_system.capitalize()} (Organic Certified: {prof.organic_certified})\n"
        )

        context_prompt = (
            f"{AGRONOMIST_SYSTEM_PROMPT}\n\n"
            f"=== BOTANICAL REFERENCE DATABASE ===\n"
            f"{format_plant_database_for_prompt()}\n\n"
            f"=== YOUR CURRENT ACTIVE DIGITAL TWIN FARM (PRIMARY TRUTH) ===\n"
            f"- Farm Name: {farm_summary['farm_name']}\n"
            f"- Current Day: {farm_summary['current_day']}\n"
            f"- Grid Size: {farm_summary['grid_size']} ({farm_summary['total_tiles']} total plots)\n"
            f"- Active Crops Distribution: {farm_summary['crops_distribution'] or 'None'}\n"
            f"- Growth Stages: {farm_summary['growth_stages']}\n"
            f"- Total Projected Yield: {farm_summary['total_projected_yield_kg']} kg\n"
            f"- Environment & Weather: Solar Rad={farm_summary['environment']['solar_radiation_wm2']} W/m², "
            f"Temp Avg={farm_summary['environment']['temp_avg_c']}°C, Rain={farm_summary['environment']['rainfall_mm']} mm, "
            f"ET0={farm_summary['environment']['et0_mm']} mm/day, Humidity={farm_summary['environment']['humidity_pct']}%\n"
            f"{profile_desc}\n"
            f"=== LIVE PLOT & SPATIAL CANVAS DETAILS ===\n"
            f"{plot_detail}\n"
            f"{frontend_context_desc}\n\n"
            f"CRITICAL INSTRUCTION: When answering the user, you MUST directly reference the above placed crops, trees, and water infrastructure on their active farm. Never claim that no crops are planted if they appear above."
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
