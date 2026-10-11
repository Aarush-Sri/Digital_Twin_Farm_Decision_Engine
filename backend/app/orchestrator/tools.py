import json
from typing import Dict, Any, List, Optional
from ..simulation.models import CropType, IrrigationType
from ..simulation.engine import SimulationEngine
from ..simulation.sandbox import SimulationSandbox, TreatmentAction
from ..llm.base import ToolDefinition, ToolCall


TOOL_DEFINITIONS: List[ToolDefinition] = [
    ToolDefinition(
        name="inspect_farm_status",
        description="Retrieves a high-level summary of the entire farm, current day, solar radiation, weather, crop distribution, and recent health logs.",
        parameters={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
    ToolDefinition(
        name="inspect_tile_detail",
        description="Inspects detailed soil chemistry (NPK, pH, moisture) and crop growth stage for a specific (x, y) tile.",
        parameters={
            "type": "object",
            "properties": {
                "x": {"type": "integer", "description": "X coordinate (0-indexed)"},
                "y": {"type": "integer", "description": "Y coordinate (0-indexed)"},
            },
            "required": ["x", "y"],
        },
    ),
    ToolDefinition(
        name="plant_crop_batch",
        description="Plants a specific crop type across a designated rectangular region or single tile.",
        parameters={
            "type": "object",
            "properties": {
                "crop_type": {
                    "type": "string",
                    "enum": ["tomato", "corn", "wheat", "soybean", "lettuce", "potato", "carrot", "cotton"],
                    "description": "Crop type to plant",
                },
                "start_x": {"type": "integer", "description": "Start X coordinate"},
                "start_y": {"type": "integer", "description": "Start Y coordinate"},
                "end_x": {"type": "integer", "description": "End X coordinate (inclusive)"},
                "end_y": {"type": "integer", "description": "End Y coordinate (inclusive)"},
            },
            "required": ["crop_type", "start_x", "start_y", "end_x", "end_y"],
        },
    ),
    ToolDefinition(
        name="apply_irrigation",
        description="Sets irrigation delivery rate (mm/day) and system type across designated coordinates or the whole farm.",
        parameters={
            "type": "object",
            "properties": {
                "rate_mm_per_day": {"type": "number", "description": "Irrigation rate in mm of water per day"},
                "irrigation_type": {
                    "type": "string",
                    "enum": ["none", "drip", "sprinkler", "flood"],
                    "description": "Type of irrigation system",
                },
                "all_tiles": {"type": "boolean", "description": "Whether to apply to all farm tiles"},
                "x": {"type": "integer", "description": "Specific tile X coordinate"},
                "y": {"type": "integer", "description": "Specific tile Y coordinate"},
            },
            "required": ["rate_mm_per_day"],
        },
    ),
    ToolDefinition(
        name="apply_fertilizer",
        description="Applies Nitrogen (N), Phosphorus (P), and Potassium (K) fertilizer amendments to enhance soil nutrients.",
        parameters={
            "type": "object",
            "properties": {
                "nitrogen_ppm": {"type": "number", "description": "Nitrogen addition in ppm"},
                "phosphorus_ppm": {"type": "number", "description": "Phosphorus addition in ppm"},
                "potassium_ppm": {"type": "number", "description": "Potassium addition in ppm"},
                "all_tiles": {"type": "boolean", "description": "Apply to all tiles"},
                "x": {"type": "integer", "description": "Specific tile X coordinate"},
                "y": {"type": "integer", "description": "Specific tile Y coordinate"},
            },
            "required": [],
        },
    ),
    ToolDefinition(
        name="run_what_if_analysis",
        description="Runs an isolated sandbox forward simulation to compare projected yield & stress between current baseline and proposed treatments.",
        parameters={
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Number of days to simulate in sandbox (e.g. 7, 14, 30)"},
                "action_description": {"type": "string", "description": "Description of candidate treatment"},
                "irrigation_rate_mm": {"type": "number", "description": "Hypothetical irrigation rate mm/day"},
                "nitrogen_ppm": {"type": "number", "description": "Hypothetical nitrogen addition ppm"},
            },
            "required": ["days"],
        },
    ),
    ToolDefinition(
        name="advance_simulation",
        description="Advances the real farm world simulation forward by N days.",
        parameters={
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Number of days to step forward"},
            },
            "required": ["days"],
        },
    ),
    ToolDefinition(
        name="inspect_farm_profile",
        description="Inspects the universal farm plot profile including farm name, geographic location, latitude, baseline temperature, soil texture, pH, and water source.",
        parameters={
            "type": "object",
            "properties": {},
            "required": [],
        },
    ),
    ToolDefinition(
        name="update_farm_profile",
        description="Updates universal plot parameters such as location name, latitude, base temperature, soil texture (loam/sandy/clay/silt), baseline pH, or water source.",
        parameters={
            "type": "object",
            "properties": {
                "farm_name": {"type": "string", "description": "Farm display name"},
                "location_name": {"type": "string", "description": "Location description (e.g. Salinas Valley)"},
                "latitude_deg": {"type": "number", "description": "Latitude in degrees (-60 to 60)"},
                "base_temp_c": {"type": "number", "description": "Annual baseline temperature in °C"},
                "soil_texture": {
                    "type": "string",
                    "enum": ["loam", "sandy", "clay", "silt"],
                    "description": "Dominant soil texture",
                },
                "baseline_ph": {"type": "number", "description": "Baseline soil pH (4.0 to 9.0)"},
                "water_source": {"type": "string", "description": "Water source description"},
            },
            "required": [],
        },
    ),
]


class ToolExecutor:
    """Executes agent tool calls directly against the live SimulationEngine."""

    def __init__(self, engine: SimulationEngine):
        self.engine = engine

    def execute(self, tool_call: ToolCall) -> Dict[str, Any]:
        name = tool_call.name
        args = tool_call.arguments

        try:
            if name == "inspect_farm_status":
                return self.engine.get_summary()

            elif name == "inspect_tile_detail":
                x = int(args.get("x", 0))
                y = int(args.get("y", 0))
                tile = self.engine.world.get_tile(x, y)
                if not tile:
                    return {"error": f"Tile ({x}, {y}) out of bounds"}
                return tile.model_dump()

            elif name == "plant_crop_batch":
                crop_type_str = args.get("crop_type", "tomato").lower()
                crop_type = CropType(crop_type_str)
                start_x = int(args.get("start_x", 0))
                start_y = int(args.get("start_y", 0))
                end_x = int(args.get("end_x", start_x))
                end_y = int(args.get("end_y", start_y))

                planted_count = 0
                for x in range(start_x, end_x + 1):
                    for y in range(start_y, end_y + 1):
                        if self.engine.plant_crop(x, y, crop_type):
                            planted_count += 1
                return {"status": "success", "planted_count": planted_count, "crop_type": crop_type_str}

            elif name == "apply_irrigation":
                rate = float(args.get("rate_mm_per_day", 5.0))
                itype_str = args.get("irrigation_type", "drip").lower()
                itype = IrrigationType(itype_str) if itype_str in IrrigationType.__members__.values() else IrrigationType.DRIP
                all_tiles = args.get("all_tiles", False)

                updated = 0
                if all_tiles:
                    for tile in self.engine.world.tiles:
                        self.engine.set_irrigation(tile.x, tile.y, itype, rate)
                        updated += 1
                else:
                    x = int(args.get("x", 0))
                    y = int(args.get("y", 0))
                    if self.engine.set_irrigation(x, y, itype, rate):
                        updated += 1
                return {"status": "success", "tiles_updated": updated, "rate_mm_per_day": rate, "irrigation_type": itype.value}

            elif name == "apply_fertilizer":
                n = float(args.get("nitrogen_ppm", 0.0))
                p = float(args.get("phosphorus_ppm", 0.0))
                k = float(args.get("potassium_ppm", 0.0))
                all_tiles = args.get("all_tiles", False)

                updated = 0
                if all_tiles:
                    for tile in self.engine.world.tiles:
                        self.engine.apply_fertilizer(tile.x, tile.y, n, p, k)
                        updated += 1
                else:
                    x = int(args.get("x", 0))
                    y = int(args.get("y", 0))
                    if self.engine.apply_fertilizer(x, y, n, p, k):
                        updated += 1
                return {"status": "success", "tiles_fertilized": updated, "added_npk": {"n": n, "p": p, "k": k}}

            elif name == "run_what_if_analysis":
                days = int(args.get("days", 14))
                candidate_actions = []
                if "irrigation_rate_mm" in args:
                    candidate_actions.append(
                        TreatmentAction(
                            action_type="irrigate",
                            all_tiles=True,
                            rate_mm=float(args["irrigation_rate_mm"]),
                            irrigation_type=IrrigationType.DRIP,
                        )
                    )
                if "nitrogen_ppm" in args:
                    candidate_actions.append(
                        TreatmentAction(
                            action_type="fertilize",
                            all_tiles=True,
                            n_ppm=float(args["nitrogen_ppm"]),
                        )
                    )

                comparison = SimulationSandbox.compare_scenarios(
                    base_world=self.engine.world,
                    days=days,
                    candidate_actions=candidate_actions,
                )
                return {
                    "days_projected": days,
                    "baseline_outcome": comparison["baseline"].model_dump(),
                    "candidate_outcome": comparison["candidate"].model_dump(),
                }

            elif name == "advance_simulation":
                days = int(args.get("days", 1))
                logs = self.engine.step_days(days)
                return {
                    "status": "success",
                    "advanced_days": days,
                    "new_day": self.engine.world.current_day,
                    "latest_log": logs[-1].model_dump() if logs else {},
                }

            elif name == "inspect_farm_profile":
                return self.engine.world.profile.model_dump()

            elif name == "update_farm_profile":
                updated = self.engine.update_profile(args)
                return {"status": "success", "profile": updated.model_dump()}

            else:
                return {"error": f"Unknown tool: {name}"}

        except Exception as e:
            return {"error": str(e)}
