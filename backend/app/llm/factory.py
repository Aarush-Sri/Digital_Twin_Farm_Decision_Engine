import json
import logging
from typing import List, Optional, Dict, Any
from .base import BaseLLMProvider, LLMMessage, LLMResponse, ToolDefinition, ToolCall
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider
from ..config import settings

logger = logging.getLogger(__name__)


class RuleBasedFallbackProvider(BaseLLMProvider):
    """Deterministic agronomist assistant providing plot-specific insights when external LLMs are unavailable."""

    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        user_msg = ""
        system_msg = ""
        tool_results: List[Dict[str, Any]] = []

        for m in messages:
            if m.role == "system" and m.content:
                system_msg = m.content
            elif m.role == "user" and m.content:
                user_msg = m.content.lower()
            elif m.role == "tool" and m.content:
                try:
                    tool_results.append(json.loads(m.content))
                except Exception:
                    tool_results.append({"raw": m.content})

        # Check if we already executed a tool call in previous step
        has_tool_results = len(tool_results) > 0

        # Step 1: If no tools executed yet, determine if a tool action is needed
        if not has_tool_results:
            tool_calls: List[ToolCall] = []

            if "water" in user_msg or "irrigate" in user_msg:
                tool_calls.append(
                    ToolCall(
                        name="apply_irrigation",
                        arguments={"all_tiles": True, "rate_mm_per_day": 8.0, "irrigation_type": "drip"},
                    )
                )
                return LLMResponse(
                    content="Inspecting soil water balance and applying drip irrigation across the farm plot...",
                    tool_calls=tool_calls,
                    provider="rule_based_fallback",
                    model="agronomist-rule-v2",
                )

            elif "plant" in user_msg or "wheat" in user_msg or "carrot" in user_msg or "tomato" in user_msg:
                crop = "wheat" if "wheat" in user_msg else "carrot" if "carrot" in user_msg else "tomato"
                tool_calls.append(
                    ToolCall(
                        name="plant_crop_batch",
                        arguments={"crop_type": crop, "start_x": 0, "start_y": 0, "end_x": 3, "end_y": 3},
                    )
                )
                return LLMResponse(
                    content=f"Planting {crop} crop batch across the designated plot coordinates...",
                    tool_calls=tool_calls,
                    provider="rule_based_fallback",
                    model="agronomist-rule-v2",
                )

            elif "what if" in user_msg or "scenario" in user_msg or "drought" in user_msg or "compare" in user_msg:
                tool_calls.append(
                    ToolCall(
                        name="run_what_if_analysis",
                        arguments={"days": 14, "action_description": "Irrigation optimization comparison"},
                    )
                )
                return LLMResponse(
                    content="Running a 14-day what-if sandbox simulation to compare projected yield outcomes...",
                    tool_calls=tool_calls,
                    provider="rule_based_fallback",
                    model="agronomist-rule-v2",
                )

            elif "step" in user_msg or "simulate" in user_msg or "advance" in user_msg or "next week" in user_msg:
                tool_calls.append(
                    ToolCall(
                        name="advance_simulation",
                        arguments={"days": 7},
                    )
                )
                return LLMResponse(
                    content="Advancing simulation time by 7 days to calculate cumulative growth and evapotranspiration...",
                    tool_calls=tool_calls,
                    provider="rule_based_fallback",
                    model="agronomist-rule-v2",
                )

            else:
                # Default to inspecting live farm status
                tool_calls.append(
                    ToolCall(
                        name="inspect_farm_status",
                        arguments={},
                    )
                )
                return LLMResponse(
                    content="Inspecting live crop phenology, soil moisture, and atmospheric conditions on the farm plot...",
                    tool_calls=tool_calls,
                    provider="rule_based_fallback",
                    model="agronomist-rule-v2",
                )

        # Step 2: Synthesize comprehensive agronomic analysis based on the live farm plot data
        response_text = self._build_plot_analysis(system_msg, tool_results, user_msg)

        return LLMResponse(
            content=response_text,
            tool_calls=[],
            provider="rule_based_fallback",
            model="agronomist-rule-v2",
        )

    def _build_plot_analysis(self, system_msg: str, tool_results: List[Dict[str, Any]], user_msg: str) -> str:
        """Generates detailed, plot-specific agronomic advice tailored to the user's specific scenario."""
        summary = None
        for res in reversed(tool_results):
            if "crops_distribution" in res:
                summary = res
                break
            elif "farm_name" in res:
                summary = res
                break

        crops_dist = summary.get("crops_distribution", {}) if summary else {}
        stages = summary.get("growth_stages", {}) if summary else {}
        env = summary.get("environment", {}) if summary else {}
        current_day = summary.get("current_day", 1) if summary else 1
        yield_kg = summary.get("total_projected_yield_kg", 0.0) if summary else 0.0

        solar_rad = env.get("solar_radiation_wm2", 450.0)
        temp_avg = env.get("temp_avg_c", 22.0)
        rain = env.get("rainfall_mm", 0.0)
        et0 = env.get("et0_mm", 4.2)

        has_crops = bool(crops_dist and sum(crops_dist.values()) > 0)
        p = user_msg.lower()

        # 1. SCENARIO: Drought / Water Stress / Heatwave
        if any(w in p for w in ["drought", "dry", "no water", "no rain", "heatwave", "hot", "sun"]):
            stressed_yield = yield_kg * 0.48
            return (
                f"### ☀️ Scenario Projection: Drought & Moisture Deficit (Day {current_day})\n\n"
                f"**Atmospheric Stress Model:**\n"
                f"- **Evaporative Demand ($ET_0$):** Escalates from `{et0:.1f} mm/day` to `~7.6 mm/day` under high VPD.\n"
                f"- **Root-Zone Depletion:** Soil moisture falls from `65%` toward permanent wilting point (`~22%`) within 5 days.\n\n"
                f"**Phenological Impact:**\n"
                f"- Stomatal closure halts photosynthetic assimilation.\n"
                f"- Projected harvest biomass decreases from **{yield_kg:.1f} kg** down to **{stressed_yield:.1f} kg** (-52% yield penalty).\n\n"
                f"**Recommended Mitigations:**\n"
                f"1. Establish drip irrigation canals flanking active crop rows.\n"
                f"2. Add perimeter windbreak trees to reduce convective boundary layer drying."
            )

        # 2. SCENARIO: Flood / Overwatering / Excessive Rain
        elif any(w in p for w in ["flood", "heavy rain", "too much water", "overwater", "storm", "saturat"]):
            return (
                f"### 🌧️ Scenario Projection: Excessive Saturation & Flood (Day {current_day})\n\n"
                f"**Soil Dynamics & Hypoxia:**\n"
                f"- **Pore Saturation:** Moisture levels surge above `85%`, eliminating aerated soil macropores.\n"
                f"- **Root Respiration:** Oxygen deprivation causes root tissue necrosis and nitrogen denitrification.\n\n"
                f"**Crop Vulnerability:**\n"
                f"- Carrots face root splitting and cavity spot; wheat suffers crown rot risk.\n\n"
                f"**Recommended Mitigations:**\n"
                f"1. Construct perimeter grass drainage channels.\n"
                f"2. Elevate crop seeding beds on 2×2m grid modules."
            )

        # 3. SCENARIO: Crop Comparison & Suitability
        elif any(w in p for w in ["compare", "carrot", "wheat", "tree", "which crop", "what to plant"]):
            return (
                f"### 🌾 Crop Variety Comparative Matrix\n\n"
                f"| Parameter | 🌾 Wheat Crop | 🥕 Carrot Patch | 🌳 Orchard Tree |\n"
                f"|---|---|---|---|\n"
                f"| **Root Architecture** | 40–60 cm fibrous | 25–35 cm taproot | 80–120 cm deep taproot |\n"
                f"| **Crop Water Need ($K_c$)** | 1.15 (Peak heading) | 1.05 (Mid-season) | 0.85 (Steady) |\n"
                f"| **Thermal Requirement** | 1800 GDD to maturity | 1200 GDD to harvest | Multi-season |\n"
                f"| **Biomass Index** | ~9.9 kg/plot | ~8.4 kg/plot | ~12.0 kg/tree |\n\n"
                f"**Field Strategy:**\n"
                f"- Wheat offers higher caloric resilience, while carrots offer faster harvest rotations. Intercropping both balances water uptake."
            )

        # 4. SCENARIO: Yield Estimation & Biomass
        elif any(w in p for w in ["yield", "harvest", "how much", "output", "biomass", "kg"]):
            crop_list_str = ", ".join([f"**{count}× {ctype.title()}**" for ctype, count in crops_dist.items()]) if has_crops else "No active crops"
            return (
                f"### ⚖️ Field Harvest & Yield Analysis (Day {current_day})\n\n"
                f"- **Active Cultivation:** {crop_list_str}\n"
                f"- **Total Projected Biomass:** **{yield_kg:.1f} kg**\n"
                f"- **Mean Thermal Rate:** `{temp_avg:.1f}°C` providing steady Growing Degree Days accumulation.\n"
                f"- **Solar Flux:** `{solar_rad:.0f} W/m²` driving photosynthesis across the canopy."
            )

        # 5. DEFAULT: General Agronomic Field Diagnosis
        lines = []
        lines.append(f"### 🌾 Agronomic Field Diagnosis (Day {current_day})")
        lines.append("")

        if has_crops:
            crop_list_str = ", ".join([f"**{count}× {ctype.title()}**" for ctype, count in crops_dist.items()])
            stage_list_str = ", ".join([f"{count} in {stg.replace('_', ' ').title()}" for stg, count in stages.items()])
            lines.append(f"**Current Plot Status:** Cultivated with {crop_list_str} ({stage_list_str}).")
            lines.append(f"- **Projected Biomass Yield:** **{yield_kg:.1f} kg**")
        else:
            lines.append("**Current Plot Status:** The farm plot is currently fallow turf. No active crop canopies were detected on the grid.")
            lines.append("- *Tip: Place Wheat Crop or Carrot Patch pieces on the canvas from the left palette to start cultivating.*")

        lines.append("")
        lines.append("### ☀️ Atmospheric & Soil Dynamics")
        lines.append(f"- **Solar Radiation:** `{solar_rad:.0f} W/m²` with daily sunlight hours of `{env.get('sunlight_hours', 12):.1f}h`.")
        lines.append(f"- **Temperature:** `{temp_avg:.1f}°C` (Daily thermal accumulation driving Growing Degree Days).")
        lines.append(f"- **Atmospheric Demand:** Reference Evapotranspiration ET₀ is `{et0:.1f} mm/day` with `{rain:.1f} mm` natural rainfall.")

        lines.append("")
        lines.append("### 💧 Soil Moisture & Irrigation Assessment")
        if has_crops:
            lines.append(f"- Active crops require **{et0 * 0.8:.1f} - {et0 * 1.1:.1f} mm/day** of water to balance evapotranspiration without inducing stomatal closure.")
            lines.append("- **Recommendation:** Maintain drip irrigation delivery between **6.0 – 8.0 mm/day** to sustain healthy soil moisture in the optimal 60–75% field capacity band.")
        else:
            lines.append("- Base soil moisture is stable at ~65%. Adding water canals or irrigation will prepare the soil beds for high germination efficiency upon seeding.")

        lines.append("")
        lines.append("### 🎯 What-If Scenarios You Can Ask:")
        lines.append("1. *\"What will happen if a 2-week drought hits?\"*")
        lines.append("2. *\"What if heavy flooding or excess rain occurs?\"*")
        lines.append("3. *\"Compare wheat vs carrots for this layout\"*")
        lines.append("4. *\"How much yield will I get from this plot?\"*")

        return "\n".join(lines)


class FallbackLLMManager(BaseLLMProvider):
    """Manages primary Gemini provider with automatic failover to Ollama (Qwen) and plot-aware rule-based fallback."""

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        gemini_model: Optional[str] = None,
        ollama_model: Optional[str] = None,
        preferred_provider: Optional[str] = "auto",
    ):
        active_key = (gemini_api_key or settings.GEMINI_API_KEY or "").strip()
        self.gemini = GeminiProvider(api_key=active_key, model=gemini_model) if active_key else None
        self.ollama = OllamaProvider(model=ollama_model or settings.OLLAMA_MODEL)
        self.fallback = RuleBasedFallbackProvider()
        self.preferred_provider = (preferred_provider or "auto").lower()

    async def generate_response(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[ToolDefinition]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        # Route 1: Direct Ollama preference requested
        if self.preferred_provider == "ollama":
            try:
                return await self.ollama.generate_response(messages, tools=tools, temperature=temperature)
            except Exception as e:
                logger.warning(f"Ollama provider failed: {e}. Falling back to Rule-Based Agent...")
            return await self.fallback.generate_response(messages, tools=tools, temperature=temperature)

        # Route 2: Gemini preference or Auto mode
        if self.gemini and self.gemini.is_configured():
            try:
                return await self.gemini.generate_response(messages, tools=tools, temperature=temperature)
            except Exception as e:
                logger.warning(f"Gemini provider failed: {e}. Falling back to Ollama...")

        # Route 3: Ollama with Qwen 3.5 / 2.5
        try:
            return await self.ollama.generate_response(messages, tools=tools, temperature=temperature)
        except Exception as e:
            logger.warning(f"Ollama provider failed: {e}. Falling back to Rule-Based Agent...")

        # Route 4: Fallback to Plot-Aware Rule-Based Provider
        return await self.fallback.generate_response(messages, tools=tools, temperature=temperature)


def get_llm_provider(
    gemini_api_key: Optional[str] = None,
    gemini_model: Optional[str] = None,
    ollama_model: Optional[str] = None,
    preferred_provider: Optional[str] = "auto",
) -> BaseLLMProvider:
    return FallbackLLMManager(
        gemini_api_key=gemini_api_key,
        gemini_model=gemini_model,
        ollama_model=ollama_model,
        preferred_provider=preferred_provider,
    )
