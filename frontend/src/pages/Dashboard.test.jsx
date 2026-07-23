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

    const grid = await screen.findByTestId("vehicle-grid");
    await within(grid).findByText(/Toyota/i);
    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), "price-asc");

    const makes = within(grid)
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent);
    expect(makes).toEqual(["Toyota", "Ford", "Porsche"]);
  });

  it("paginates vehicles, 9 per page, with working Previous/Next", async () => {
    const vehicles = Array.from({ length: 12 }, (_, i) => makeVehicle(i + 1));
    listVehicles.mockResolvedValue(vehicles);
    renderDashboard();

    const grid = await screen.findByTestId("vehicle-grid");
    await within(grid).findByText(/Make01/i);
    expect(within(grid).getAllByRole("heading", { level: 3 })).toHaveLength(9);
    expect(within(grid).queryByText(/Make10/i)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(await within(grid).findByText(/Make10/i)).toBeInTheDocument();
    expect(within(grid).queryByText(/Make01/i)).not.toBeInTheDocument();
    expect(within(grid).getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(await within(grid).findByText(/Make01/i)).toBeInTheDocument();
  });

  it("does not show pagination controls when everything fits on one page", async () => {
    listVehicles.mockResolvedValue(sortTestVehicles);
    renderDashboard();

    const grid = await screen.findByTestId("vehicle-grid");
    await within(grid).findByText(/Toyota/i);
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("resets to page 1 when a new search is performed", async () => {
    const vehicles = Array.from({ length: 12 }, (_, i) => makeVehicle(i + 1));
    listVehicles.mockResolvedValue(vehicles);
    const { searchVehicles } = await import("../api/vehicles");
    searchVehicles.mockResolvedValue([sortTestVehicles[0]]);

    renderDashboard();
    let grid = await screen.findByTestId("vehicle-grid");
    await within(grid).findByText(/Make01/i);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await within(grid).findByText(/Make10/i);

    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));

    grid = await screen.findByTestId("vehicle-grid");
    expect(await within(grid).findByText(/Toyota/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });
});

describe("Dashboard welcome, featured vehicles, and skeleton loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a welcome message with the user's first name", async () => {
    useAuth.mockReturnValue({ isAdmin: false, user: { first_name: "Jane" } });
    listVehicles.mockResolvedValue(sortTestVehicles);

    renderDashboard();

    expect(await screen.findByText(/welcome back, jane/i)).toBeInTheDocument();
  });

  it("falls back to a generic welcome message when first name is unavailable", async () => {
    useAuth.mockReturnValue({ isAdmin: false, user: { email: "jane@example.com" } });
    listVehicles.mockResolvedValue(sortTestVehicles);

    renderDashboard();

    expect(await screen.findByText(/^welcome back$/i)).toBeInTheDocument();
  });

  it("shows a featured vehicles section highlighting up to 3 vehicles", async () => {
    useAuth.mockReturnValue({ isAdmin: false, user: { first_name: "Jane" } });
    listVehicles.mockResolvedValue(sortTestVehicles);

    renderDashboard();

    expect(await screen.findByRole("heading", { name: /featured vehicles/i })).toBeInTheDocument();
    const featuredSection = screen.getByTestId("featured-vehicles");
    expect(within(featuredSection).getAllByText(/toyota|ford|porsche/i).length).toBeGreaterThan(0);
  });

  it("shows skeleton loading placeholders while vehicles are loading", () => {
    useAuth.mockReturnValue({ isAdmin: false, user: { first_name: "Jane" } });
    listVehicles.mockImplementation(() => new Promise(() => {}));

    renderDashboard();

    expect(screen.getByRole("status", { name: /loading vehicles/i })).toBeInTheDocument();
  });
});
