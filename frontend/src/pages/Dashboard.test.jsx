import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Dashboard from "./Dashboard";
import { useAuth } from "../hooks/useAuth";
import { listVehicles } from "../api/vehicles";

vi.mock("../hooks/useAuth");
vi.mock("../api/vehicles");

function makeVehicle(i) {
  return {
    id: `v${i}`,
    make: `Make${String(i).padStart(2, "0")}`,
    model: "Model",
    category: i % 2 === 0 ? "sedan" : "suv",
    price: String(10000 + i * 1000),
    quantity: i,
  };
}

const sortTestVehicles = [
  { id: "v1", make: "Toyota", model: "Corolla", category: "sedan", price: "22000.00", quantity: 5 },
  { id: "v2", make: "Ford", model: "F-150", category: "truck", price: "35000.00", quantity: 0 },
  { id: "v3", make: "Porsche", model: "911", category: "coupe", price: "90000.00", quantity: 2 },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Dashboard sorting and pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAdmin: false });
  });

  it("sorts vehicles by price low to high when selected", async () => {
    listVehicles.mockResolvedValue(sortTestVehicles);
    renderDashboard();

    await screen.findByText(/Toyota/i);
    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), "price-asc");

    const makes = screen.getAllByRole("heading", { level: 3 }).map((el) => el.textContent);
    expect(makes).toEqual(["Toyota", "Ford", "Porsche"]);
  });

  it("paginates vehicles, 9 per page, with working Previous/Next", async () => {
    const vehicles = Array.from({ length: 12 }, (_, i) => makeVehicle(i + 1));
    listVehicles.mockResolvedValue(vehicles);
    renderDashboard();

    await screen.findByText(/Make01/i);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9);
    expect(screen.queryByText(/Make10/i)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(await screen.findByText(/Make10/i)).toBeInTheDocument();
    expect(screen.queryByText(/Make01/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(await screen.findByText(/Make01/i)).toBeInTheDocument();
  });

  it("does not show pagination controls when everything fits on one page", async () => {
    listVehicles.mockResolvedValue(sortTestVehicles);
    renderDashboard();

    await screen.findByText(/Toyota/i);
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("resets to page 1 when a new search is performed", async () => {
    const vehicles = Array.from({ length: 12 }, (_, i) => makeVehicle(i + 1));
    listVehicles.mockResolvedValue(vehicles);
    const { searchVehicles } = await import("../api/vehicles");
    searchVehicles.mockResolvedValue([sortTestVehicles[0]]);

    renderDashboard();
    await screen.findByText(/Make01/i);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText(/Make10/i);

    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));

    expect(await screen.findByText(/Toyota/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });
});
