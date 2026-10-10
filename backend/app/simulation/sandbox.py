from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from .models import FarmWorld, CropType, IrrigationType
from .engine import SimulationEngine


class TreatmentAction(BaseModel):
    action_type: str  # "irrigate", "fertilize", "plant"
    x: Optional[int] = None
    y: Optional[int] = None
    all_tiles: bool = False
    rate_mm: Optional[float] = None
    irrigation_type: Optional[IrrigationType] = None
    n_ppm: Optional[float] = None
    p_ppm: Optional[float] = None
    k_ppm: Optional[float] = None
    crop_type: Optional[CropType] = None


class ScenarioResult(BaseModel):
    scenario_name: str
    simulated_days: int
    final_avg_moisture_pct: float
    final_avg_health_pct: float
    final_total_biomass_kg: float
    final_projected_yield_kg: float
    water_applied_mm_total: float
    summary_verdict: str


class SimulationSandbox:
    """Runs isolated 'What-If' sandbox forecasts on cloned farm worlds."""

    @staticmethod
    def run_scenario(
        base_world: FarmWorld,
        days: int,
        actions: Optional[List[TreatmentAction]] = None,
        weather_modifier: Optional[dict] = None,
        scenario_name: str = "Candidate Scenario"
    ) -> ScenarioResult:
        """Clones the farm world and simulates forward under given actions."""
        sandboxed_world = base_world.clone()
        engine = SimulationEngine(world=sandboxed_world)

        water_applied_total = 0.0
        if actions:
            for act in actions:
                targets = []
                if act.all_tiles:
                    targets = sandboxed_world.tiles
                elif act.x is not None and act.y is not None:
                    tile = sandboxed_world.get_tile(act.x, act.y)
                    if tile:
                        targets = [tile]

                for tile in targets:
                    if act.action_type == "irrigate" and act.rate_mm is not None:
                        itype = act.irrigation_type or IrrigationType.DRIP
                        engine.set_irrigation(tile.x, tile.y, itype, act.rate_mm)
                        water_applied_total += (act.rate_mm * days)
                    elif act.action_type == "fertilize":
                        engine.apply_fertilizer(
                            tile.x,
                            tile.y,
                            nitrogen_ppm=act.n_ppm or 0.0,
                            phosphorus_ppm=act.p_ppm or 0.0,
                            potassium_ppm=act.k_ppm or 0.0,
                        )
                    elif act.action_type == "plant" and act.crop_type:
                        engine.plant_crop(tile.x, tile.y, act.crop_type)

        engine.step_days(days, weather_override=weather_modifier)

        summary = engine.get_summary()
        recent_log = sandboxed_world.history[-1] if sandboxed_world.history else None

        avg_moisture = recent_log.avg_soil_moisture if recent_log else 60.0
        avg_health = recent_log.avg_crop_health if recent_log else 100.0
        total_biomass = recent_log.total_biomass_kg if recent_log else 0.0
        total_yield = summary.get("total_projected_yield_kg", 0.0)

        verdict = "Optimal conditions maintained"
        if avg_moisture < 25.0:
            verdict = "Severe drought stress projected"
        elif avg_moisture > 80.0:
            verdict = "Waterlogging risk detected"
        elif avg_health < 60.0:
            verdict = "Sub-optimal crop health trajectory"

        return ScenarioResult(
            scenario_name=scenario_name,
            simulated_days=days,
            final_avg_moisture_pct=avg_moisture,
            final_avg_health_pct=avg_health,
            final_total_biomass_kg=total_biomass,
            final_projected_yield_kg=total_yield,
            water_applied_mm_total=round(water_applied_total, 2),
            summary_verdict=verdict,
        )

    @classmethod
    def compare_scenarios(
        cls,
        base_world: FarmWorld,
        days: int,
        candidate_actions: List[TreatmentAction],
        weather_modifier: Optional[dict] = None
    ) -> Dict[str, ScenarioResult]:
        """Compares a 'Do-Nothing / Status Quo' baseline against candidate treatment actions."""
        baseline_res = cls.run_scenario(
            base_world=base_world,
            days=days,
            actions=[],
            weather_modifier=weather_modifier,
            scenario_name="Baseline (Status Quo)"
        )
        candidate_res = cls.run_scenario(
            base_world=base_world,
            days=days,
            actions=candidate_actions,
            weather_modifier=weather_modifier,
            scenario_name="Candidate Treatment Plan"
        )
        return {
            "baseline": baseline_res,
            "candidate": candidate_res,
        }
