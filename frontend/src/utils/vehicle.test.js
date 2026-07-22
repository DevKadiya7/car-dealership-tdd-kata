import { sortVehicles } from "./vehicle";

const vehicles = [
  { make: "Toyota", category: "sedan", price: "22000.00", quantity: 5 },
  { make: "Ford", category: "truck", price: "35000.00", quantity: 0 },
  { make: "Porsche", category: "coupe", price: "90000.00", quantity: 2 },
];

describe("sortVehicles", () => {
  it("sorts by price low to high", () => {
    const result = sortVehicles(vehicles, "price-asc");
    expect(result.map((v) => v.make)).toEqual(["Toyota", "Ford", "Porsche"]);
  });

  it("sorts by price high to low", () => {
    const result = sortVehicles(vehicles, "price-desc");
    expect(result.map((v) => v.make)).toEqual(["Porsche", "Ford", "Toyota"]);
  });

  it("sorts by make A to Z", () => {
    const result = sortVehicles(vehicles, "make-asc");
    expect(result.map((v) => v.make)).toEqual(["Ford", "Porsche", "Toyota"]);
  });

  it("sorts by make Z to A", () => {
    const result = sortVehicles(vehicles, "make-desc");
    expect(result.map((v) => v.make)).toEqual(["Toyota", "Porsche", "Ford"]);
  });

  it("sorts by category alphabetically", () => {
    const result = sortVehicles(vehicles, "category");
    expect(result.map((v) => v.category)).toEqual(["coupe", "sedan", "truck"]);
  });

  it("sorts by stock availability, most in stock first", () => {
    const result = sortVehicles(vehicles, "stock");
    expect(result.map((v) => v.make)).toEqual(["Toyota", "Porsche", "Ford"]);
  });

  it("leaves the order unchanged for an unknown or empty sort key", () => {
    const result = sortVehicles(vehicles, "");
    expect(result.map((v) => v.make)).toEqual(["Toyota", "Ford", "Porsche"]);
  });

  it("does not mutate the original array", () => {
    const original = [...vehicles];
    sortVehicles(vehicles, "price-asc");
    expect(vehicles).toEqual(original);
  });
});
