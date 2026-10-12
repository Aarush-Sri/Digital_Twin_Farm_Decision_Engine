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


def test_sync_farm_layout_api():
    create_resp = client.post("/api/v1/farm/create", json={"name": "Sync Test Farm", "width": 10, "height": 10})
    assert create_resp.status_code == 200
    farm_id = create_resp.json()["farm_id"]

    # Sync complex layout with crops extending to 20m (x=800px)
    sync_items = [
        {"id": "b1", "type": "barn", "x": 60, "y": 60, "width": 160, "height": 160},
        {"id": "w1", "type": "water", "x": 420, "y": 220, "width": 200, "height": 60},
        {"id": "c1", "type": "corn", "x": 500, "y": 60, "width": 160, "height": 120},
        {"id": "wh1", "type": "wheat", "x": 680, "y": 60, "width": 180, "height": 120},
        {"id": "p1", "type": "pumpkin", "x": 740, "y": 320, "width": 140, "height": 100},
        {"id": "t1", "type": "neem_tree", "x": 60, "y": 0, "width": 80, "height": 80},
    ]

    sync_resp = client.post(
        f"/api/v1/farm/{farm_id}/sync",
        json={
            "items": sync_items,
            "farm_settings": {"name": "Synced Twin", "boundaryWidthM": 100, "boundaryHeightM": 100},
            "farm_profile": {"soil_texture": "loam", "organic_matter_pct": 3.5},
        },
    )
    assert sync_resp.status_code == 200
    data = sync_resp.json()
    assert data["status"] == "synchronized"
    assert data["items_count"] == 6

    # Verify summary includes crops, trees, and projected yield
    summary = data["summary"]
    assert "corn" in summary["crops_distribution"]
    assert "wheat" in summary["crops_distribution"]
    assert "pumpkin" in summary["crops_distribution"]
    assert "neem_tree" in summary["crops_distribution"]
    assert summary["total_projected_yield_kg"] > 0
    # Verify grid expanded beyond 10 columns to accommodate x=740px + 140px = 880px (22m)
    assert data["world"]["width"] >= 22
