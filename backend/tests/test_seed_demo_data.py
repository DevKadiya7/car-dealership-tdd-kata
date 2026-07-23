"""Tests for the demo vehicle seed script (scripts/seed_demo_data.py).

Written test-first: the script doesn't exist yet, so these fail with
ImportError until it's created.
"""
from decimal import Decimal

import pytest

from app.models.vehicle import Vehicle
from app.utils.constants import VEHICLE_CATEGORIES

seed_demo_data = pytest.importorskip("scripts.seed_demo_data")
DEMO_VEHICLES = seed_demo_data.DEMO_VEHICLES
seed_vehicles = seed_demo_data.seed_vehicles


def test_demo_vehicles_has_at_least_25_entries():
    assert len(DEMO_VEHICLES) >= 25


def test_demo_vehicles_have_required_fields_and_valid_ranges():
    for entry in DEMO_VEHICLES:
        assert entry["make"].strip()
        assert entry["model"].strip()
        assert entry["category"] in VEHICLE_CATEGORIES
        assert Decimal("600000") <= Decimal(str(entry["price"])) <= Decimal("8000000")
        assert 1 <= entry["quantity"] <= 20
        assert entry["image_url"].startswith("https://")


def test_demo_vehicles_include_multiple_brands():
    makes = {entry["make"] for entry in DEMO_VEHICLES}
    assert len(makes) >= 10


def test_seed_vehicles_inserts_into_database(db_session):
    seed_vehicles(db_session)

    count = db_session.query(Vehicle).count()
    assert count == len(DEMO_VEHICLES)


def test_seed_vehicles_is_idempotent(db_session):
    seed_vehicles(db_session)
    seed_vehicles(db_session)

    count = db_session.query(Vehicle).count()
    assert count == len(DEMO_VEHICLES)
