import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminInventory from "./AdminInventory";
import {
  listVehicles,
  searchVehicles,
  addVehicle,
  updateVehicle,
  restockVehicle,
  deleteVehicle,
} from "../api/vehicles";

vi.mock("../api/vehicles");

const healthyVehicle = {
  id: "v1",
  make: "Honda",
  model: "Civic",
  category: "sedan",
  price: "24000.00",
  quantity: 10,
};
const lowVehicle = {
  id: "v2",
  make: "Mazda",
  model: "CX-5",
  category: "suv",
  price: "28000.00",
  quantity: 2,
};
const soldOutVehicle = {
  id: "v3",
  make: "Nissan",
  model: "Leaf",
  category: "electric",
  price: "27000.00",
  quantity: 0,
};

describe("AdminInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it("shows a loading state while vehicles load", () => {
    listVehicles.mockImplementation(() => new Promise(() => {}));

    render(<AdminInventory />);

    expect(screen.getByText(/Fetching inventory/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no vehicles", async () => {
    listVehicles.mockResolvedValue([]);

    render(<AdminInventory />);

    expect(await screen.findByText(/no vehicles match/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listVehicles.mockRejectedValue(new Error("network down"));

    render(<AdminInventory />);

    expect(await screen.findByText(/couldn't load the inventory/i)).toBeInTheDocument();
  });

  it("lists all vehicles in a table with make, model, category, price, and stock status", async () => {
    listVehicles.mockResolvedValue([healthyVehicle, lowVehicle, soldOutVehicle]);

    render(<AdminInventory />);

    expect(await screen.findByText(/Honda Civic/i)).toBeInTheDocument();
    expect(screen.getByText(/Mazda CX-5/i)).toBeInTheDocument();
    expect(screen.getByText(/Nissan Leaf/i)).toBeInTheDocument();
    expect(screen.getByText(/\$24,000/)).toBeInTheDocument();
    expect(screen.getByText(/Low Stock/i)).toBeInTheDocument();
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
    expect(screen.getByText(/In Stock/i)).toBeInTheDocument();
  });

  it("creates a new vehicle via the Add Vehicle modal", async () => {
    listVehicles.mockResolvedValue([healthyVehicle]);
    addVehicle.mockResolvedValue({ ...lowVehicle, id: "v4" });

    render(<AdminInventory />);
    await screen.findByText(/Honda Civic/i);

    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));
    expect(screen.getByRole("heading", { name: /add vehicle/i })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/make/i), "Mazda");
    await userEvent.type(screen.getByLabelText(/model/i), "CX-5");
    await userEvent.type(screen.getByLabelText(/price/i), "28000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "2");
    await userEvent.click(screen.getByRole("button", { name: /^add vehicle$/i }));

    await waitFor(() => expect(addVehicle).toHaveBeenCalled());
  });

  it("edits a vehicle via the Edit action", async () => {
    listVehicles.mockResolvedValue([healthyVehicle]);
    updateVehicle.mockResolvedValue({ ...healthyVehicle, price: "25000.00" });

    render(<AdminInventory />);
    await screen.findByText(/Honda Civic/i);

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByRole("heading", { name: /edit vehicle/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(updateVehicle).toHaveBeenCalledWith("v1", expect.any(Object)));
  });

  it("restocks a vehicle when Restock is clicked", async () => {
    listVehicles.mockResolvedValue([lowVehicle]);
    restockVehicle.mockResolvedValue({ ...lowVehicle, quantity: 3 });

    render(<AdminInventory />);
    await screen.findByText(/Mazda CX-5/i);

    await userEvent.click(screen.getByRole("button", { name: /restock/i }));
    await waitFor(() => expect(restockVehicle).toHaveBeenCalledWith("v2"));
  });

  it("deletes a vehicle after confirmation", async () => {
    listVehicles.mockResolvedValue([lowVehicle]);
    deleteVehicle.mockResolvedValue({});

    render(<AdminInventory />);
    await screen.findByText(/Mazda CX-5/i);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(deleteVehicle).toHaveBeenCalledWith("v2"));
  });

  it("searches vehicles via the search bar", async () => {
    listVehicles.mockResolvedValue([healthyVehicle, lowVehicle]);
    searchVehicles.mockResolvedValue([healthyVehicle]);

    render(<AdminInventory />);
    await screen.findByText(/Honda Civic/i);

    await userEvent.type(screen.getByPlaceholderText(/^make$/i), "Honda");
    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(searchVehicles).toHaveBeenCalled());
    expect(await screen.findByText(/Honda Civic/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mazda CX-5/i)).not.toBeInTheDocument();
  });

  it("sorts vehicles by price when a sort option is selected", async () => {
    listVehicles.mockResolvedValue([soldOutVehicle, healthyVehicle, lowVehicle]);

    render(<AdminInventory />);
    await screen.findByText(/Honda Civic/i);

    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), "price-asc");

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Honda Civic");
  });

  it("paginates when there are more than one page of vehicles", async () => {
    const vehicles = Array.from({ length: 9 }, (_, i) => ({
      id: `v${i}`,
      make: `Make${String(i).padStart(2, "0")}`,
      model: "Model",
      category: "sedan",
      price: String(10000 + i * 1000),
      quantity: 5,
    }));
    listVehicles.mockResolvedValue(vehicles);

    render(<AdminInventory />);
    await screen.findByText(/Make00/i);

    expect(screen.queryByText(/Make08/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/Make08/i)).toBeInTheDocument();
  });
});
