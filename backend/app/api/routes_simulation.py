from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..storage.session_store import session_store
from ..simulation.models import EnvironmentState, SimulationLogEntry
from ..simulation.sandbox import SimulationSandbox, TreatmentAction, ScenarioResult

router = APIRouter(prefix="/api/v1/simulation", tags=["Simulation Engine"])


class StepSimulationRequest(BaseModel):
    days: int = Field(default=1, ge=1, le=365)
    temp_override_c: Optional[float] = None
    rainfall_override_mm: Optional[float] = None
    solar_radiation_override_wm2: Optional[float] = None


class WhatIfScenarioRequest(BaseModel):
    days: int = Field(default=14, ge=1, le=120)
    candidate_actions: List[TreatmentAction] = Field(default_factory=list)
    weather_modifier: Optional[Dict[str, Any]] = None


@router.post("/{farm_id}/step", response_model=Dict[str, Any])
def step_simulation(farm_id: str, req: StepSimulationRequest):
    """Advances simulation time by N days and updates all solar, thermal, and biological states."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")

    override = {}
    if req.temp_override_c is not None:
        override["temp_avg_c"] = req.temp_override_c
    if req.rainfall_override_mm is not None:
        override["rainfall_mm"] = req.rainfall_override_mm
    if req.solar_radiation_override_wm2 is not None:
        override["solar_radiation_wm2"] = req.solar_radiation_override_wm2

    logs = engine.step_days(req.days, weather_override=override if override else None)

    return {
        "status": "stepped",
        "days_advanced": req.days,
        "current_day": engine.world.current_day,
        "environment": engine.world.environment.model_dump(),
        "latest_log": logs[-1].model_dump() if logs else {},
        "summary": engine.get_summary(),
    }


@router.post("/{farm_id}/what-if", response_model=Dict[str, Any])
def run_what_if_comparison(farm_id: str, req: WhatIfScenarioRequest):
    """Clones farm state and simulates forward under candidate actions vs status-quo baseline."""
    engine = session_store.get_engine(farm_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Farm not found")

    comparison = SimulationSandbox.compare_scenarios(
        base_world=engine.world,
        days=req.days,
        candidate_actions=req.candidate_actions,
        weather_modifier=req.weather_modifier,
    )

    return {
        "farm_id": farm_id,
        "simulated_days": req.days,
        "baseline": comparison["baseline"].model_dump(),
        "candidate": comparison["candidate"].model_dump(),
    }
