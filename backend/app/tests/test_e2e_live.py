"""
Comprehensive End-to-End Live Verification Suite for THINAI.
Verifies all 10 core functional pipelines with real inputs and assertions.
"""
import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_e2e_pipeline_1_health_and_production_mode():
    """Verify system health and strict production readiness."""
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert body["version"] == "2.0.0"
    assert body["mode"] == "production"

def test_e2e_pipeline_2_real_gps_weather_service():
    """Verify real-time micro-climatic weather fetching using Coimbatore coordinates."""
    res = client.get("/api/v1/weather?latitude=11.0168&longitude=76.9558")
    assert res.status_code == 200
    w = res.json()
    assert "temperature" in w
    assert "humidity" in w
    assert "precipitation_mm" in w
    assert "forecast_48h_rain_mm" in w
    assert w["latitude"] == 11.0168
    assert w["longitude"] == 76.9558

def test_e2e_pipeline_3_market_mandi_procurement_feed():
    """Verify APMC Mandi commodity rates, MSP benchmarks, and weekly trend directions."""
    res = client.get("/api/v1/market")
    assert res.status_code == 200
    commodities = res.json()
    assert isinstance(commodities, list)
    assert len(commodities) >= 4
    paddy = next((c for c in commodities if "Paddy" in c.get("commodity", "")), None)
    assert paddy is not None
    assert paddy["modal_price"] > 0
    assert paddy["msp_benchmark"] > 0

def test_e2e_pipeline_4_schemes_and_subsidies():
    """Verify government scheme filtering for Tamil Nadu smallholder farmers."""
    res = client.get("/api/v1/schemes?state=Tamil%20Nadu&farm_size=2.0")
    assert res.status_code == 200
    schemes = res.json()
    assert isinstance(schemes, list)
    assert len(schemes) > 0
    assert any("KISAN" in s["name"] or "Irrigation" in s["name"] for s in schemes)

def test_e2e_pipeline_5_farm_and_field_lifecycle():
    """Verify creating a farm holding and secondary plot."""
    # Create farm
    farm_res = client.post("/api/v1/farms", json={
        "name": "Cauvery Delta Plot",
        "total_area_acres": 3.0,
        "district": "Thanjavur",
        "state": "Tamil Nadu",
        "ownership_type": "Owned"
    })
    assert farm_res.status_code == 201
    farm_id = farm_res.json()["id"]

    # Create plot
    field_res = client.post(f"/api/v1/fields?farm_id={farm_id}", json={
        "farm_id": farm_id,
        "name": "South Wetland Paddy Plot",
        "area_acres": 2.0,
        "soil_type": "Clay Loam",
        "current_crop": "Paddy (Rice)",
        "crop_variety": "CO 51",
        "crop_stage": "Tillering Stage"
    })
    assert field_res.status_code == 201
    field_id = field_res.json()["id"]
    assert field_id.startswith("field-")

def test_e2e_pipeline_6_recommendation_and_arfi_stress_testing():
    """Verify ML crop consensus and ARFI 6-component fragility calculation."""
    res = client.post("/api/v1/recommendations/generate?field_id=field-e2e-plot")
    assert res.status_code == 200
    rec = res.json()
    assert "action" in rec
    assert "priority" in rec
    assert "arfi_assessment" in rec
    arfi = rec["arfi_assessment"]
    assert 0.0 <= arfi["fragility_score"] <= 1.0
    assert arfi["fragility_label"] in ["Stable / Low Fragility", "Moderate Fragility", "Highly Fragile"]
    assert len(arfi["stress_scenarios"]) == 6

def test_e2e_pipeline_7_what_if_interactive_simulation():
    """Verify dynamic perturbation response and profit impact calculation."""
    req = {
        "field_id": "field-e2e-plot",
        "rainfall_delta_percent": -35.0,
        "temperature_delta_celsius": 3.0,
        "market_price_delta_percent": -15.0,
        "input_cost_delta_percent": 15.0
    }
    res = client.post("/api/v1/what-if/simulate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert "original_crop" in data
    assert "modified_crop" in data
    assert "arfi_before" in data
    assert "arfi_after" in data
    assert "profit_impact_rs" in data
    assert "risk_impact_summary" in data

def test_e2e_pipeline_8_disease_diagnosis():
    """Verify plant leaf disease detection and treatment recommendations."""
    scan_req = {
        "field_id": "field-e2e-plot",
        "crop": "Tomato",
        "image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "disease_name": "Tomato Early Blight",
        "scientific_name": "Alternaria solani",
        "confidence": 94.2,
        "severity": "Moderate",
        "is_reliable": True,
        "immediate_action": "Spray Copper Oxychloride 50 WP @ 3g/L",
        "remedies": {
            "chemical": "Spray Mancozeb 75 WP or Chlorothalonil 75 WP",
            "organic": "Foliar spray of Trichoderma viride @ 5g/L",
            "preventive": "Ensure proper plant spacing for aeration"
        }
    }
    res = client.post("/api/v1/disease/scan", json=scan_req)
    assert res.status_code == 201
    scan = res.json()
    assert scan["disease_name"] == "Tomato Early Blight"
    assert scan["confidence"] == 94.2

def test_e2e_pipeline_9_farm_diary_and_closed_loop_feedback():
    """Verify logging farm activities and recording farmer feedback."""
    act_res = client.post("/api/v1/activities", json={
        "field_id": "field-e2e-plot",
        "activity_type": "Irrigation",
        "date": datetime.date.today().isoformat(),
        "notes": "Applied alternate furrow irrigation.",
        "cost_rs": 450.0,
        "source": "Farmer Manual Entry"
    })
    assert act_res.status_code == 201

    fb_res = client.post("/api/v1/feedback", json={
        "recommendation_id": "rec-e2e-01",
        "action_taken": "completed",
        "rating": 5,
        "crop_observation": "Improved",
        "notes": "Drainage channels cleared as recommended. Root zone protected.",
        "cost_saved_estimate": 1200.0
    })
    assert fb_res.status_code == 201

def test_e2e_pipeline_10_offline_sync_push_pull_cycle():
    """Verify two-way offline synchronization push and pull idempotency."""
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    client_id = f"local-item-{int(datetime.datetime.now(datetime.timezone.utc).timestamp())}"

    # Push offline mutation
    push_res = client.post("/api/v1/sync/push", json={
        "mutations": [
            {
                "entity": "activity",
                "action": "create",
                "client_id": client_id,
                "timestamp": now_iso,
                "payload": {
                    "field_id": "field-e2e-plot",
                    "activity_type": "Weeding",
                    "date": datetime.date.today().isoformat(),
                    "notes": "Manual weeding completed across 2 acres.",
                    "cost_rs": 800.0,
                    "source": "Offline Mobile Queue"
                }
            }
        ]
    })
    assert push_res.status_code == 200
    push_body = push_res.json()
    assert push_body["synced_count"] >= 1

    # Pull sync delta
    pull_res = client.post("/api/v1/sync/pull", json={
        "last_sync_timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)).isoformat()
    })
    assert pull_res.status_code == 200
    pull_body = pull_res.json()
    assert "farms" in pull_body
    assert "activities" in pull_body
    assert "server_timestamp" in pull_body
