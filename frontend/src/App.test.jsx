import { render, screen } from "@testing-library/react";
import App from "./App";
import { listVehicles } from "./api/vehicles";

vi.mock("./api/vehicles", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listVehicles: vi.fn(),
    searchVehicles: vi.fn(),
    addVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    restockVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
  };
});

describe("App routing", () => {
  it("renders the admin dashboard route for admin users", async () => {
    listVehicles.mockResolvedValue([]);

    window.history.pushState({}, "Admin Dashboard", "/admin/dashboard");
    localStorage.setItem("user", JSON.stringify({ email: "admin@company.com", role: "admin" }));
    localStorage.setItem("access_token", "fake-token");

    render(<App />);

    expect(await screen.findByText(/Admin Panel/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dashboard/i })).toBeInTheDocument();
  });
  it("renders the relocated inventory page at /admin/vehicles", async () => {
    listVehicles.mockResolvedValue([]);

    window.history.pushState({}, "Admin Vehicles", "/admin/vehicles");
    localStorage.setItem("user", JSON.stringify({ email: "admin@company.com", role: "admin" }));
    localStorage.setItem("access_token", "fake-token");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /Vehicle Management/i })).toBeInTheDocument();
  });
});
