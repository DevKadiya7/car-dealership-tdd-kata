import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import VehicleDetail from "./VehicleDetail";
import { getVehicle, purchaseVehicle } from "../api/vehicles";

vi.mock("../api/vehicles");

const vehicle = {
  id: "v1",
  make: "Toyota",
  model: "Corolla",
  category: "sedan",
  price: "22000.00",
  quantity: 5,
  image_url: "https://example.com/corolla.jpg",
};

function renderDetail({ withState = true } = {}) {
  return render(
    <MemoryRouter
      initialEntries={[
        withState ? { pathname: "/vehicles/v1", state: { vehicle } } : "/vehicles/v1",
      ]}
    >
      <Routes>
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("VehicleDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders vehicle details passed via route state without fetching", () => {
    renderDetail({ withState: true });

    expect(screen.getByText(/toyota/i)).toBeInTheDocument();
    expect(screen.getByText(/corolla/i)).toBeInTheDocument();
    expect(screen.getByText(/22,000/)).toBeInTheDocument();
    expect(getVehicle).not.toHaveBeenCalled();
  });

  it("fetches the vehicle by id when no route state is provided", async () => {
    getVehicle.mockResolvedValue(vehicle);

    renderDetail({ withState: false });

    expect(await screen.findByText(/toyota/i)).toBeInTheDocument();
    expect(getVehicle).toHaveBeenCalledWith("v1");
  });

  it("shows a fallback image when image_url is missing", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/vehicles/v1", state: { vehicle: { ...vehicle, image_url: null } } }]}
      >
        <Routes>
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
  });

  it("purchases the vehicle when the button is clicked", async () => {
    purchaseVehicle.mockResolvedValue({ ...vehicle, quantity: 4 });

    renderDetail({ withState: true });

    await userEvent.click(screen.getByRole("button", { name: /purchase/i }));

    expect(purchaseVehicle).toHaveBeenCalledWith("v1");
    expect(await screen.findByText(/04 units/i)).toBeInTheDocument();
  });

  it("disables the purchase button when out of stock", () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/vehicles/v1", state: { vehicle: { ...vehicle, quantity: 0 } } }]}
      >
        <Routes>
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /sold out/i })).toBeDisabled();
  });
});
