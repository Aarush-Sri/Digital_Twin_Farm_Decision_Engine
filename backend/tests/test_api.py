import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "online"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_farm_lifecycle_api():
    # 1. Create farm
    create_resp = client.post("/api/v1/farm/create", json={"name": "Test Greenfield", "width": 4, "height": 4})
    assert create_resp.status_code == 200
    farm_id = create_resp.json()["farm_id"]
    assert farm_id is not None

    # 2. Get farm state
    state_resp = client.get(f"/api/v1/farm/{farm_id}")
    assert state_resp.status_code == 200
    assert state_resp.json()["width"] == 4
    assert len(state_resp.json()["tiles"]) == 16

    # 3. Batch plant crops
    plant_resp = client.post(
        f"/api/v1/farm/{farm_id}/batch/plant",
        json={"crop_type": "tomato", "start_x": 0, "start_y": 0, "end_x": 1, "end_y": 1},
    )
    assert plant_resp.status_code == 200
    assert plant_resp.json()["planted_count"] == 4

    # 4. Step simulation
    step_resp = client.post(
        f"/api/v1/simulation/{farm_id}/step",
        json={"days": 5},
    )
    assert step_resp.status_code == 200
    assert step_resp.json()["current_day"] == 6

    # 5. Run What-If sandbox comparison
    what_if_resp = client.post(
        f"/api/v1/simulation/{farm_id}/what-if",
        json={
            "days": 10,
            "candidate_actions": [
                {"action_type": "irrigate", "all_tiles": True, "rate_mm": 5.0}
            ],
        },
    )
    assert what_if_resp.status_code == 200
    assert "baseline" in what_if_resp.json()
    assert "candidate" in what_if_resp.json()

    # 6. Chat with AI Agent
    chat_resp = client.post(
        f"/api/v1/agent/{farm_id}/chat",
        json={"prompt": "How is my tomato crop doing? Should I add water?"},
    )
    assert chat_resp.status_code == 200
    assert "final_response" in chat_resp.json()
    assert len(chat_resp.json()["execution_steps"]) > 0
