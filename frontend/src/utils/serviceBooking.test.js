import { uniqueOwnedVehicles } from "./serviceBooking";

describe("uniqueOwnedVehicles", () => {
  it("dedupes purchases of the same vehicle down to one entry", () => {
    const purchases = [
      { vehicle_id: "v1", vehicle_make: "Toyota", vehicle_model: "Fortuner" },
      { vehicle_id: "v1", vehicle_make: "Toyota", vehicle_model: "Fortuner" },
      { vehicle_id: "v2", vehicle_make: "Honda", vehicle_model: "City" },
    ];

    expect(uniqueOwnedVehicles(purchases)).toEqual([
      { vehicle_id: "v1", vehicle_make: "Toyota", vehicle_model: "Fortuner" },
      { vehicle_id: "v2", vehicle_make: "Honda", vehicle_model: "City" },
    ]);
  });

  it("returns an empty array for no purchases", () => {
    expect(uniqueOwnedVehicles([])).toEqual([]);
  });
});
