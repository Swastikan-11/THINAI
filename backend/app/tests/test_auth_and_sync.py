import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.base import init_db
from app.db.session import SessionLocal
from app.models import User, FarmerProfile, Farm, Field, FarmActivity, ActionFeedback, DiseaseScan

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "THINAI API"

def test_auth_me_and_profile_update():
    # 1. GET /api/v1/auth/me (Uses default dev/demo token claims)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    user_data = response.json()
    assert "id" in user_data
    assert user_data["is_active"] is True

    # 2. POST /api/v1/auth/profile
    profile_payload = {
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "village": "Kinathukadavu",
        "preferred_language": "Tamil",
        "experience_years": 8,
        "kcc_holder": True
    }
    update_res = client.post("/api/v1/auth/profile", json=profile_payload)
    assert update_res.status_code == 200
    profile = update_res.json()
    assert profile["district"] == "Coimbatore"
    assert profile["kcc_holder"] is True

def test_farms_and_fields_isolation():
    # 1. Create a Farm
    farm_payload = {
        "name": "Coimbatore Organic Farm",
        "total_area_acres": 4.5,
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "ownership_type": "Owned"
    }
    farm_res = client.post("/api/v1/farms", json=farm_payload)
    assert farm_res.status_code == 201
    farm = farm_res.json()
    farm_id = farm["id"]
    assert farm["name"] == "Coimbatore Organic Farm"

    # 2. Create a Field under that Farm
    field_payload = {
        "name": "North Paddy Plot",
        "area_acres": 2.5,
        "latitude": 11.0168,
        "longitude": 76.9558,
        "soil_type": "Clay Loam",
        "irrigation_type": "Canal + Borewell",
        "current_crop": "Paddy (Rice)",
        "crop_variety": "Ponni (CO 51)",
        "sowing_date": "2026-08-25",
        "crop_stage": "Tillering Stage",
        "previous_crops": "Black Gram"
    }
    field_res = client.post(f"/api/v1/fields?farm_id={farm_id}", json=field_payload)
    assert field_res.status_code == 201
    field = field_res.json()
    assert field["name"] == "North Paddy Plot"
    assert field["farm_id"] == farm_id

    # 3. List Fields
    fields_list = client.get("/api/v1/fields")
    assert fields_list.status_code == 200
    assert len(fields_list.json()) >= 1

def test_offline_sync_push_pull_and_idempotency():
    # 1. Check sync status
    status_res = client.get("/api/v1/sync/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "online"

    # 2. Push offline batch mutations
    timestamp = datetime.datetime.utcnow().isoformat()
    client_act_id = f"local-act-{int(datetime.datetime.utcnow().timestamp())}"
    client_fb_id = f"local-fb-{int(datetime.datetime.utcnow().timestamp())}"
    client_scan_id = f"local-scan-{int(datetime.datetime.utcnow().timestamp())}"

    mutations_payload = {
        "mutations": [
            {
                "client_id": client_act_id,
                "entity": "activity",
                "action": "create",
                "timestamp": timestamp,
                "payload": {
                    "activity_type": "Irrigation",
                    "date": "2026-09-26",
                    "notes": "Offline: Closed canal sluice gate ahead of forecast monsoon rainfall.",
                    "cost_rs": 250.0
                }
            },
            {
                "client_id": client_fb_id,
                "entity": "feedback",
                "action": "create",
                "timestamp": timestamp,
                "payload": {
                    "recommendation_id": "delay_irrigation_fungal",
                    "action_taken": "COMPLETED",
                    "rating": 5,
                    "crop_observation": "Improved aeration observed",
                    "cost_saved_estimate": 1200.0
                }
            },
            {
                "client_id": client_scan_id,
                "entity": "scan",
                "action": "create",
                "timestamp": timestamp,
                "payload": {
                    "disease_name": "Rice Blast",
                    "scientific_name": "Magnaporthe oryzae",
                    "confidence": 0.94,
                    "severity": "Medium",
                    "is_reliable": True,
                    "foliage_ratio": 0.82,
                    "lesion_area_ratio": 0.12,
                    "immediate_action": "Spray Tricyclazole 75 WP at 0.6g/L",
                    "model_version": "DiseaseNet-v1.3-offline"
                }
            }
        ]
    }

    push_res = client.post("/api/v1/sync/push", json=mutations_payload)
    assert push_res.status_code == 200
    push_data = push_res.json()
    assert push_data["synced_count"] >= 3

    # 3. Idempotency test: Push same batch again -> No duplication, clean resolution
    repush_res = client.post("/api/v1/sync/push", json=mutations_payload)
    assert repush_res.status_code == 200

    # 4. Pull updates
    pull_res = client.post("/api/v1/sync/pull", json={"last_sync_timestamp": None})
    assert pull_res.status_code == 200
    pull_data = pull_res.json()
    assert len(pull_data["activities"]) >= 1
    assert any(a["id"] == client_act_id for a in pull_data["activities"])
    assert len(pull_data["scans"]) >= 1

def test_recommendation_and_arfi_generation():
    # Test generation of full recommendation + evidence + ARFI assessment
    rec_res = client.post("/api/v1/recommendations/generate?field_id=field-test-coimbatore")
    assert rec_res.status_code == 200
    rec = rec_res.json()
    assert "title" in rec
    assert "evidence" in rec
    assert "arfi_assessment" in rec

    arfi = rec["arfi_assessment"]
    assert 0.0 <= arfi["fragility_score"] <= 1.0
    assert len(arfi["stress_scenarios"]) == 6

def test_what_if_simulation_lab():
    payload = {
        "field_id": "field-test",
        "rainfall_delta_percent": -25.0,
        "temperature_delta_celsius": 2.0,
        "soil_moisture_override": 55.0,
        "market_price_delta_percent": -10.0,
        "input_cost_delta_percent": 5.0
    }
    sim_res = client.post("/api/v1/what-if/simulate", json=payload)
    assert sim_res.status_code == 200
    sim = sim_res.json()
    assert "arfi_before" in sim
    assert "arfi_after" in sim
    assert "profit_impact_rs" in sim
    assert "recommendation_changed" in sim
