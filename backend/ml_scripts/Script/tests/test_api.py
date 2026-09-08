"""
Tests for Phase 9 — Production FastAPI Endpoint Contract.
"""

import pytest
from fastapi.testclient import TestClient
from mplads_v7.api.app import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert data["version"] == "7.0.0"


def test_risk_summary_endpoint():
    response = client.get("/risk/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_canonical_works"] > 0
    assert data["lok_sabha_works"] > 0
    assert data["rajya_sabha_works"] > 0


def test_works_list_endpoint():
    response = client.get("/works?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    assert len(data["works"]) <= 5


def test_work_by_id_and_case_card():
    # Get a valid work ID from /works list
    res_list = client.get("/works?limit=1")
    works = res_list.json()["works"]
    assert len(works) > 0

    first_work = works[0]
    w_id = first_work["work_id"]
    house = first_work["parliament_house"]

    # Test GET /works/{house}/{id}
    res_detail = client.get(f"/works/{house}/{w_id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["work_id"] == w_id

    # Test GET /works/{house}/{id}/lifecycle
    res_lc = client.get(f"/works/{house}/{w_id}/lifecycle")
    assert res_lc.status_code == 200

    # Test GET /works/{house}/{id}/payments
    res_pmt = client.get(f"/works/{house}/{w_id}/payments")
    assert res_pmt.status_code == 200

    # Test Case Card GET /works/{id}/evidence
    res_card = client.get(f"/works/{w_id}/evidence?house={house}")
    assert res_card.status_code == 200
    card_data = res_card.json()
    assert "risk_score" in card_data
    assert "risk_band" in card_data
    assert "calibrated_probability" in card_data
    assert "risk_factors" in card_data
