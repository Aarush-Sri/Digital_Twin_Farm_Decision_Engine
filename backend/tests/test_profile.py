import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.engine import SimulationEngine
from app.simulation.models import SoilTexture, FarmProfile
from app.orchestrator.tools import ToolExecutor
from app.llm.base import ToolCall

client = TestClient(app)


def test_engine_profile_calibration():
    engine = SimulationEngine()
    assert engine.world.profile.latitude_deg == 36.5
    assert engine.world.profile.soil_texture == SoilTexture.LOAM
    assert engine.env_engine.latitude_deg == 36.5

    # Update profile to Sandy soil at higher latitude
    new_profile = engine.update_profile({
        "farm_name": "Highland Valley",
        "location_name": "Oregon Highlands",
        "latitude_deg": 45.0,
        "soil_texture": "sandy",
        "baseline_ph": 7.2,
    })

    assert new_profile.farm_name == "Highland Valley"
    assert new_profile.location_name == "Oregon Highlands"
    assert new_profile.latitude_deg == 45.0
    assert new_profile.soil_texture == SoilTexture.SANDY
    assert engine.env_engine.latitude_deg == 45.0
    assert engine.world.name == "Highland Valley"

    # Verify tile hydrology adapted to sandy soil (with OM bonus)
    sample_tile = engine.world.tiles[0]
    assert sample_tile.soil.field_capacity_pct == 45.6
    assert sample_tile.soil.wilting_point_pct == 10.0
    assert sample_tile.soil.ph == 7.2


def test_api_profile_endpoints():
    # 1. Create farm
    create_res = client.post("/api/v1/farm/create", json={"name": "Api Farm", "width": 4, "height": 4})
    assert create_res.status_code == 200
    farm_id = create_res.json()["farm_id"]

    # 2. Get profile
    prof_res = client.get(f"/api/v1/farm/{farm_id}/profile")
    assert prof_res.status_code == 200
    data = prof_res.json()
    assert data["latitude_deg"] == 36.5
    assert data["soil_texture"] == "loam"

    # 3. Update profile
    put_res = client.put(
        f"/api/v1/farm/{farm_id}/profile",
        json={
            "farm_name": "Sunrise Orchard",
            "location_name": "Yakima Valley, WA",
            "latitude_deg": 46.6,
            "soil_texture": "clay",
            "baseline_ph": 6.8,
            "water_source": "Canal / Irrigation District",
        },
    )
    assert put_res.status_code == 200
    updated_data = put_res.json()["profile"]
    assert updated_data["farm_name"] == "Sunrise Orchard"
    assert updated_data["latitude_deg"] == 46.6
    assert updated_data["soil_texture"] == "clay"
    assert updated_data["water_source"] == "Canal / Irrigation District"

    # 4. Verify summary reflects updated profile
    summary_res = client.get(f"/api/v1/farm/{farm_id}/summary")
    assert summary_res.status_code == 200
    assert summary_res.json()["farm_name"] == "Sunrise Orchard"
    assert summary_res.json()["profile"]["soil_texture"] == "clay"


def test_tool_executor_profile():
    engine = SimulationEngine()
    executor = ToolExecutor(engine)

    # Inspect profile
    inspect_call = ToolCall(name="inspect_farm_profile", arguments={})
    res_inspect = executor.execute(inspect_call)
    assert res_inspect["soil_texture"] == "loam"
    assert res_inspect["latitude_deg"] == 36.5

    # Update profile via tool
    update_call = ToolCall(
        name="update_farm_profile",
        arguments={
            "farm_name": "Agent Managed Farm",
            "soil_texture": "silt",
            "baseline_ph": 6.2,
        },
    )
    res_update = executor.execute(update_call)
    assert res_update["status"] == "success"
    assert res_update["profile"]["soil_texture"] == "silt"
    assert engine.world.tiles[0].soil.field_capacity_pct == 78.6
