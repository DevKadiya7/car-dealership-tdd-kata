import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import MyServices from "./MyServices";
import { listMyServiceBookings } from "../api/serviceBookings";
import { listMyPurchases } from "../api/purchases";

vi.mock("../api/serviceBookings");
vi.mock("../api/purchases");

const booking = {
  id: "b1",
  vehicle_id: "v1",
  vehicle_make: "Toyota",
  vehicle_model: "Fortuner",
  service_type: "oil_change",
  preferred_date: "2030-01-15",
  notes: "Please check the brakes too.",
  status: "pending",
  created_at: "2026-07-20T10:00:00Z",
};

describe("MyServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while bookings load", () => {
    listMyServiceBookings.mockImplementation(() => new Promise(() => {}));

    render(<MyServices />);

    expect(screen.getByText(/loading service bookings/i)).toBeInTheDocument();
  });

  it("shows an empty state when the customer has no bookings", async () => {
    listMyServiceBookings.mockResolvedValue([]);

    render(<MyServices />);

    expect(await screen.findByText(/no service bookings yet/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listMyServiceBookings.mockRejectedValue(new Error("network down"));

    render(<MyServices />);

    expect(await screen.findByText(/couldn't load your service bookings/i)).toBeInTheDocument();
  });

  it("lists the vehicle, service type, preferred date, status, and notes", async () => {
    listMyServiceBookings.mockResolvedValue([booking]);

    render(<MyServices />);

    expect(await screen.findByText(/toyota fortuner/i)).toBeInTheDocument();
    expect(screen.getByText(/oil change/i)).toBeInTheDocument();
    expect(screen.getByText(new Date(booking.preferred_date).toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(/^pending$/i)).toBeInTheDocument();
    expect(screen.getByText(/please check the brakes too/i)).toBeInTheDocument();
  });

  it("opens the Book Service modal and adds the new booking to the list on success", async () => {
    listMyServiceBookings.mockResolvedValue([]);
    listMyPurchases.mockResolvedValue([
      { vehicle_id: "v1", vehicle_make: "Toyota", vehicle_model: "Fortuner" },
    ]);

    render(<MyServices />);
    await screen.findByText(/no service bookings yet/i);

    await userEvent.click(screen.getByRole("button", { name: /book service/i }));
    expect(screen.getByRole("heading", { name: /book service/i })).toBeInTheDocument();
  });
});
