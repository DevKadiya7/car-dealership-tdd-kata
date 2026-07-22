import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AdminInventory from "./AdminInventory";
import { listVehicles, restockVehicle, deleteVehicle } from "../api/vehicles";

vi.mock("../api/vehicles");

const healthyVehicle = { id: "v1", make: "Honda", model: "Civic", quantity: 10 };
const lowVehicle = { id: "v2", make: "Mazda", model: "CX-5", quantity: 2 };
const soldOutVehicle = { id: "v3", make: "Nissan", model: "Leaf", quantity: 0 };

describe("AdminInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it("shows a loading state while vehicles load", async () => {
    listVehicles.mockImplementation(() => new Promise(() => {}));

    render(<AdminInventory />);

    expect(screen.getByText(/Checking stock levels/i)).toBeInTheDocument();
  });

  it("shows an empty state when nothing needs attention", async () => {
    listVehicles.mockResolvedValue([healthyVehicle]);

    render(<AdminInventory />);

    expect(
      await screen.findByText(/Every listing has healthy stock/i)
    ).toBeInTheDocument();
  });

  it("lists only low-stock and sold-out vehicles, sorted by quantity", async () => {
    listVehicles.mockResolvedValue([healthyVehicle, lowVehicle, soldOutVehicle]);

    render(<AdminInventory />);

    expect(await screen.findByText(/Nissan Leaf/i)).toBeInTheDocument();
    expect(screen.getByText(/Mazda CX-5/i)).toBeInTheDocument();
    expect(screen.queryByText(/Honda Civic/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Sold out/i)).toBeInTheDocument();
    expect(screen.getByText(/2 left/i)).toBeInTheDocument();
  });

  it("restocks a vehicle when Restock +1 is clicked", async () => {
    listVehicles.mockResolvedValue([lowVehicle]);
    restockVehicle.mockResolvedValue({ ...lowVehicle, quantity: 3 });

    render(<AdminInventory />);

    const restockBtn = await screen.findByRole("button", { name: /Restock \+1/i });
    restockBtn.click();

    await waitFor(() => expect(restockVehicle).toHaveBeenCalledWith("v2"));
  });

  it("deletes a vehicle after confirmation", async () => {
    listVehicles.mockResolvedValue([lowVehicle]);
    deleteVehicle.mockResolvedValue({});

    render(<AdminInventory />);

    const deleteBtn = await screen.findByRole("button", { name: /Delete/i });
    deleteBtn.click();

    await waitFor(() => expect(deleteVehicle).toHaveBeenCalledWith("v2"));
    expect(await screen.findByText(/Every listing has healthy stock/i)).toBeInTheDocument();
  });
});