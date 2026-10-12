import hashlib
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class PlotEvent(BaseModel):
    timestamp_day: int
    event_type: str  # "plant", "irrigate", "fertilize", "simulate", "inspect"
    description: str


class PlotMemoryRecord(BaseModel):
    x: int
    y: int
    crop_type: Optional[str] = None
    stage: Optional[str] = None
    health_pct: float = 100.0
    moisture_pct: float = 0.0
    irrigation_type: str = "none"
    irrigation_rate_mm: float = 0.0
    last_updated_day: int = 0


class FarmPlotMemory:
    """Stateful memory for farm plots, tracking changes, deltas, and intervention history.
    
    Prevents dumping the entire raw farm context into every query, significantly reducing
    token consumption and eliminating repetitive rate limits (429 errors).
    """

    # Keywords that indicate the query is purely conceptual / general agronomy
    GENERAL_QUERY_KEYWORDS = [
        "what is", "how do", "how does", "explain", "difference between", 
        "why do", "define", "hello", "hi", "hey", "who are you", "help",
        "optimal ph", "nitrogen cycle", "penman", "evapotranspiration",
        "best temperature", "what fertilizer", "tell me about"
    ]

    # Keywords that explicitly request live farm status or operations
    FARM_EXPLICIT_KEYWORDS = [
        "my farm", "our farm", "plot", "tile", "crop", "plant", "water", 
        "irrigate", "fertilize", "harvest", "yield", "simulate", "drought", 
        "heatwave", "current", "status", "how are", "what should i do",
        "recommend", "inspect", "check", "field"
    ]

    def __init__(self, farm_id: str):
        self.farm_id = farm_id
        self.known_plots: Dict[Tuple[int, int], PlotMemoryRecord] = {}
        self.events_log: List[PlotEvent] = []
        self.last_state_hash: Optional[str] = None
        self.last_injected_day: Optional[int] = None
        self.turn_count: int = 0
        self.full_context_sent: bool = False

    def compute_state_hash(self, world_tiles: List[Any], current_day: int, items_2d: Optional[List[Dict[str, Any]]] = None) -> str:
        """Computes a lightweight hash of farm state to detect true changes."""
        tile_data = []
        for t in world_tiles:
            crop_name = t.crop.crop_type.value if t.crop else "none"
            stage = t.crop.current_stage.value if t.crop else "none"
            health = round(t.crop.health_pct, 1) if t.crop else 0
            moist = round(t.soil.moisture_pct, 1)
            irr = f"{t.irrigation_type.value}:{t.irrigation_rate_mm_per_day}"
            tile_data.append(f"{t.x},{t.y}:{crop_name}:{stage}:{health}:{moist}:{irr}")

        items_summary = ""
        if items_2d:
            items_summary = ";".join([f"{it.get('type')}:{it.get('x_m')},{it.get('y_m')}" for it in items_2d[:16]])

        raw_str = f"day={current_day}|" + "|".join(tile_data) + f"|items={items_summary}"
        return hashlib.md5(raw_str.encode("utf-8")).hexdigest()

    def update_memory_from_world(self, world_tiles: List[Any], current_day: int) -> List[str]:
        """Updates internal plot records and returns a list of human-readable delta changes."""
        changes = []
        for t in world_tiles:
            coord = (t.x, t.y)
            prev = self.known_plots.get(coord)

            crop_name = t.crop.crop_type.value if t.crop else None
            stage = t.crop.current_stage.value if t.crop else None
            health = t.crop.health_pct if t.crop else 100.0
            moisture = t.soil.moisture_pct
            irr_type = t.irrigation_type.value
            irr_rate = t.irrigation_rate_mm_per_day

            if not prev:
                if crop_name:
                    changes.append(f"Plot ({t.x},{t.y}): Initialized with {crop_name} (Moisture: {moisture:.1f}%)")
            else:
                if prev.crop_type != crop_name:
                    if crop_name:
                        changes.append(f"Plot ({t.x},{t.y}): Planted {crop_name} (was {prev.crop_type or 'empty'})")
                    else:
                        changes.append(f"Plot ({t.x},{t.y}): Cleared {prev.crop_type}")
                elif crop_name and prev.stage != stage:
                    changes.append(f"Plot ({t.x},{t.y}): {crop_name} transitioned from {prev.stage} to {stage}")
                elif prev.irrigation_type != irr_type or prev.irrigation_rate_mm != irr_rate:
                    changes.append(f"Plot ({t.x},{t.y}): Irrigation adjusted to {irr_type} @ {irr_rate}mm/day")

            self.known_plots[coord] = PlotMemoryRecord(
                x=t.x,
                y=t.y,
                crop_type=crop_name,
                stage=stage,
                health_pct=health,
                moisture_pct=moisture,
                irrigation_type=irr_type,
                irrigation_rate_mm=irr_rate,
                last_updated_day=current_day,
            )

        return changes

    def record_event(self, day: int, event_type: str, description: str):
        """Records an action or intervention in plot history."""
        self.events_log.append(PlotEvent(
            timestamp_day=day,
            event_type=event_type,
            description=description,
        ))
        if len(self.events_log) > 50:
            self.events_log = self.events_log[-50:]

    def is_general_query(self, user_prompt: str) -> bool:
        """Determines if the prompt is general agronomy and does not need farm plot context."""
        prompt_lower = user_prompt.lower().strip()
        
        # If user explicitly references the farm or operations, it is not general
        if any(keyword in prompt_lower for keyword in self.FARM_EXPLICIT_KEYWORDS):
            return False

        # If it matches general explanation or greeting patterns
        if any(prompt_lower.startswith(q) for q in self.GENERAL_QUERY_KEYWORDS):
            return True

        return False

    def generate_context_prompt(
        self,
        engine_summary: Dict[str, Any],
        world_tiles: List[Any],
        user_prompt: str,
        frontend_farm_context: Optional[Dict[str, Any]] = None,
        force_refresh: bool = False,
    ) -> Tuple[str, bool]:
        """Intelligently generates context prompt:
        - If general query: returns lightweight role context without plot dump.
        - If plots unchanged: returns brief memory confirmation + deltas.
        - If first run / changed: returns concise structured summary and remembers state.
        
        Returns: (context_string, was_full_dump)
        """
        self.turn_count += 1
        current_day = engine_summary.get("current_day", 1)
        items_2d = frontend_farm_context.get("items_2d", []) if frontend_farm_context else []

        # 1. Purely general question -> Omit farm context entirely
        if self.is_general_query(user_prompt) and not force_refresh:
            return (
                f"[Plot Memory Note]: User query appears to be general agronomy. "
                f"Answer concisely. Farm state memory is active (Day {current_day}), "
                f"use `inspect_farm_status` only if needed.",
                False
            )

        # Compute hash to detect changes
        current_hash = self.compute_state_hash(world_tiles, current_day, items_2d)
        has_changed = (current_hash != self.last_state_hash)
        deltas = self.update_memory_from_world(world_tiles, current_day)

        # 2. Subsequent turn with NO changes -> Use compact memory anchor
        if self.full_context_sent and not has_changed and not force_refresh:
            memory_events_str = ""
            if self.events_log:
                recent_events = [f"• Day {e.timestamp_day}: {e.description}" for e in self.events_log[-3:]]
                memory_events_str = "\nRecent Farm Interventions:\n" + "\n".join(recent_events)

            active_crops_str = ", ".join([f"{count}x {ctype.title()}" for ctype, count in engine_summary['crops_distribution'].items()]) if engine_summary.get('crops_distribution') else "None (Fallow turf)"
            context = (
                f"=== FARM PLOT MEMORY (Cached) ===\n"
                f"- Farm: '{engine_summary['farm_name']}' | Day: {current_day} | Weather: {engine_summary['environment']['temp_avg_c']}°C, ET0={engine_summary['environment']['et0_mm']}mm\n"
                f"- Active Planted Crops: {active_crops_str} (No changes since previous turn. STRICT: ONLY these crops exist on this farm. Never invent unplanted crops)\n"
                f"{memory_events_str}\n"
                f"[Plot Memory Active]: Farm plot layout is unchanged. Use tools (`inspect_tile_detail`, `inspect_farm_status`) if specific sensor readings are needed."
            )
            return (context, False)

        # 3. State has changed or First Turn -> Provide structured memory summary
        self.last_state_hash = current_hash
        self.last_injected_day = current_day
        self.full_context_sent = True

        crop_tiles_desc = []
        irrigation_desc = []
        fallow_count = 0
        for t in world_tiles:
            if t.crop:
                crop_tiles_desc.append(
                    f"Tile ({t.x},{t.y}): {t.crop.crop_type.value} [Stage={t.crop.current_stage.value}, Health={t.crop.health_pct:.0f}%, Moist={t.soil.moisture_pct:.1f}%, Irr={t.irrigation_type.value} {t.irrigation_rate_mm_per_day}mm/day]"
                )
            elif t.irrigation_type.value != "none":
                irrigation_desc.append(
                    f"Tile ({t.x},{t.y}): Irr={t.irrigation_type.value} @ {t.irrigation_rate_mm_per_day}mm/day [Moist={t.soil.moisture_pct:.1f}%]"
                )
            else:
                fallow_count += 1

        delta_section = ""
        if deltas:
            delta_section = f"\n- Recent Plot Deltas ({len(deltas)} updates):\n  " + "\n  ".join(deltas[:8])

        events_section = ""
        if self.events_log:
            recent_events = [f"• Day {e.timestamp_day}: {e.description}" for e in self.events_log[-4:]]
            events_section = f"\n- Action History Log:\n  " + "\n  ".join(recent_events)

        # Compact frontend items representation
        items_summary = f"None"
        if items_2d:
            items_summary = f"{len(items_2d)} elements on canvas (" + ", ".join(list(set(it.get('type', 'item') for it in items_2d[:10]))) + ")"

        active_crops_str = ", ".join([f"{count}x {ctype.title()}" for ctype, count in engine_summary['crops_distribution'].items()]) if engine_summary.get('crops_distribution') else "None (Fallow turf)"
        context = (
            f"=== FARM PLOT MEMORY & CURRENT STATE ===\n"
            f"- Farm: {engine_summary['farm_name']} | Day: {current_day} | Grid: {engine_summary['grid_size']} ({engine_summary['total_tiles']} plots)\n"
            f"- Active Planted Crops: {active_crops_str} | Total Baseline Projected Yield: {engine_summary['total_projected_yield_kg']} kg\n"
            f"  * [GROUNDING RULE]: ONLY these planted crops exist on this farm. Do NOT mention or project yields for any unplanted crops (e.g., no potato, lettuce, etc.).\n"
            f"- Environment: Temp={engine_summary['environment']['temp_avg_c']}°C, Rain={engine_summary['environment']['rainfall_mm']}mm, ET0={engine_summary['environment']['et0_mm']}mm/day, Humidity={engine_summary['environment']['humidity_pct']}%\n"
            f"- Cultivated Plots ({len(crop_tiles_desc)} tiles):\n  " +
            ("\n  ".join(crop_tiles_desc[:12]) if crop_tiles_desc else "No crops planted yet (fallow turf)") +
            f"\n- Active Irrigation Channels ({len(irrigation_desc)} tiles):\n  " +
            ("\n  ".join(irrigation_desc[:6]) if irrigation_desc else "No dedicated irrigation channels") +
            f"\n- Fallow/Open Turf: {fallow_count} plots" +
            f"\n- 2D Canvas Items: {items_summary}" +
            f"{delta_section}" +
            f"{events_section}"
        )

        return (context, True)


class PlotMemoryManager:
    """Singleton registry managing FarmPlotMemory instances per farm_id."""

    def __init__(self):
        self._memories: Dict[str, FarmPlotMemory] = {}

    def get_memory(self, farm_id: str) -> FarmPlotMemory:
        if farm_id not in self._memories:
            self._memories[farm_id] = FarmPlotMemory(farm_id)
        return self._memories[farm_id]

    def clear_memory(self, farm_id: str):
        if farm_id in self._memories:
            del self._memories[farm_id]


plot_memory_manager = PlotMemoryManager()
