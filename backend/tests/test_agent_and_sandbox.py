import pytest
from app.simulation.engine import SimulationEngine
from app.simulation.models import CropType, IrrigationType
from app.simulation.sandbox import SimulationSandbox, TreatmentAction
from app.orchestrator.agent import AgricultureAgent
from app.orchestrator.tools import ToolExecutor, TOOL_DEFINITIONS
from app.llm.base import ToolCall


def test_simulation_sandbox_comparison():
    engine = SimulationEngine()
    # Plant crops on all tiles and drain moisture to create drought conditions
    for tile in engine.world.tiles:
        engine.plant_crop(tile.x, tile.y, CropType.TOMATO)
        tile.soil.moisture_pct = 25.0  # Drought state

    # Compare doing nothing in drought vs adding 3.5mm drip irrigation
    candidate_actions = [
        TreatmentAction(
            action_type="irrigate",
            all_tiles=True,
            rate_mm=3.5,
            irrigation_type=IrrigationType.DRIP,
        )
    ]

    res = SimulationSandbox.compare_scenarios(
        base_world=engine.world,
        days=15,
        candidate_actions=candidate_actions,
        weather_modifier={"rainfall_mm": 0.0},
    )

    baseline = res["baseline"]
    candidate = res["candidate"]

    # Candidate with irrigation should retain much higher soil moisture and health
    assert candidate.final_avg_moisture_pct > baseline.final_avg_moisture_pct
    assert candidate.final_avg_health_pct >= baseline.final_avg_health_pct


def test_tool_executor_dispatch():
    engine = SimulationEngine()
    executor = ToolExecutor(engine)

    # Test plant tool
    call_plant = ToolCall(
        name="plant_crop_batch",
        arguments={"crop_type": "wheat", "start_x": 0, "start_y": 0, "end_x": 2, "end_y": 2},
    )
    res_plant = executor.execute(call_plant)
    assert res_plant["status"] == "success"
    assert res_plant["planted_count"] == 9

    # Test irrigation tool
    call_irrigate = ToolCall(
        name="apply_irrigation",
        arguments={"all_tiles": True, "rate_mm_per_day": 4.5, "irrigation_type": "drip"},
    )
    res_irrigate = executor.execute(call_irrigate)
    assert res_irrigate["status"] == "success"


@pytest.mark.asyncio
async def test_agent_run_loop():
    engine = SimulationEngine()
    agent = AgricultureAgent(engine=engine)
    resp = await agent.run("Please inspect the farm and water the crops if moisture is low.")

    assert resp.final_response is not None
    assert len(resp.execution_steps) > 0
    assert resp.provider_used in ["gemini", "ollama", "rule_based_fallback"]


@pytest.mark.asyncio
async def test_agent_run_with_frontend_farm_context():
    engine = SimulationEngine()
    agent = AgricultureAgent(engine=engine)
    frontend_context = {
        "canvas_scale": {"pixels_per_meter": 40, "grid_snap_m": 0.5},
        "total_items": 2,
        "active_model": {"label": "Llama 3.2 (1B)", "provider": "Local Ollama", "is_local": True},
        "ui_patch_details": {
            "title": "GreenTwin",
            "active_tab": "scenarios",
            "selected_scenario": {
                "title": "Drought",
                "subtitle": "Less rainfall for 14 days",
                "yieldDelta": "-12%",
                "waterDemand": "Higher",
            },
        },
        "items_2d": [
            {"id": "w1", "type": "wheat", "x_m": 2.0, "y_m": 2.0, "width_m": 4.0, "height_m": 4.0, "nearest_water_dist_m": 2.0, "category": "Crops"},
            {"id": "p1", "type": "water", "x_m": 8.0, "y_m": 2.0, "width_m": 2.0, "height_m": 2.0, "nearest_water_dist_m": 0.0, "category": "Irrigation"},
        ],
    }

    resp = await agent.run(
        user_prompt="Explain how the 14-day drought affects my wheat plot given water distance.",
        frontend_farm_context=frontend_context,
    )

    assert resp.final_response is not None
    assert len(resp.execution_steps) > 0
    assert resp.provider_used in ["gemini", "ollama", "rule_based_fallback"]

