"""Populate the database with realistic demo inventory so the UI looks
like a real dealership instead of an empty project.

Run with:
    python -m scripts.seed_demo_data

Reuses the existing VehicleRepository (no duplicated insert logic) and is
idempotent - re-running it will not create duplicate rows, since each
entry is matched by (make, model) before inserting.
"""
from app.database import SessionLocal
from app.repositories.vehicle_repository import VehicleRepository

_IMAGE_POOL = [
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800",
    "https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=800",
    "https://images.unsplash.com/photo-1622199822063-1518c4bf7cca?w=800",
]


def _vehicle(index, make, model, category, price, quantity):
    return {
        "make": make,
        "model": model,
        "category": category,
        "price": price,
        "quantity": quantity,
        "image_url": _IMAGE_POOL[index % len(_IMAGE_POOL)],
    }


DEMO_VEHICLES = [
    _vehicle(0, "Toyota", "Innova Crysta", "suv", 2200000, 8),
    _vehicle(1, "Toyota", "Camry", "sedan", 4500000, 3),
    _vehicle(2, "Honda", "City", "sedan", 1400000, 12),
    _vehicle(3, "Honda", "Elevate", "suv", 1600000, 9),
    _vehicle(4, "Hyundai", "Creta", "suv", 1700000, 15),
    _vehicle(5, "Hyundai", "i20", "hatchback", 900000, 18),
    _vehicle(6, "Hyundai", "Ioniq 5", "electric", 4600000, 3),
    _vehicle(7, "Kia", "Seltos", "suv", 1800000, 10),
    _vehicle(8, "Kia", "Sonet", "suv", 1200000, 14),
    _vehicle(9, "Suzuki", "Swift", "hatchback", 750000, 20),
    _vehicle(0, "Suzuki", "Baleno", "hatchback", 850000, 16),
    _vehicle(1, "Tata", "Nexon", "suv", 1100000, 17),
    _vehicle(2, "Tata", "Punch", "hatchback", 700000, 19),
    _vehicle(3, "Tata", "Nexon EV", "electric", 1700000, 8),
    _vehicle(4, "Mahindra", "XUV700", "suv", 2100000, 7),
    _vehicle(5, "Mahindra", "Bolero Pik-Up", "pickup", 1000000, 6),
    _vehicle(6, "BMW", "3 Series", "luxury", 5500000, 3),
    _vehicle(7, "BMW", "X5", "luxury", 8000000, 2),
    _vehicle(8, "Mercedes", "C-Class", "luxury", 6000000, 3),
    _vehicle(9, "Mercedes", "GLE", "luxury", 8000000, 2),
    _vehicle(0, "Audi", "A4", "luxury", 4800000, 4),
    _vehicle(1, "Volkswagen", "Virtus", "sedan", 1300000, 11),
    _vehicle(2, "Volkswagen", "Taigun", "suv", 1500000, 10),
    _vehicle(3, "Skoda", "Slavia", "sedan", 1350000, 9),
    _vehicle(4, "Skoda", "Kushaq", "suv", 1450000, 8),
    _vehicle(5, "MG", "Hector", "suv", 1900000, 6),
    _vehicle(6, "MG", "ZS EV", "electric", 2500000, 5),
    _vehicle(7, "Nissan", "Magnite", "suv", 950000, 13),
    _vehicle(8, "Nissan", "Kicks", "suv", 1250000, 7),
    _vehicle(9, "Jeep", "Compass", "suv", 2200000, 4),
]


def seed_vehicles(db):
    """Inserts DEMO_VEHICLES, skipping any (make, model) pair that
    already exists so the script can be re-run safely."""
    repository = VehicleRepository(db)
    existing = {(v.make, v.model) for v in repository.list_all()}

    created = []
    for entry in DEMO_VEHICLES:
        if (entry["make"], entry["model"]) in existing:
            continue
        created.append(repository.create(**entry))
    return created


if __name__ == "__main__":
    session = SessionLocal()
    try:
        created = seed_vehicles(session)
        print(f"Seeded {len(created)} new vehicle(s); {len(DEMO_VEHICLES) - len(created)} already existed.")
    finally:
        session.close()
