import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminServiceBookings from "./AdminServiceBookings";
import { listAllServiceBookings, setServiceBookingStatus } from "../api/serviceBookings";

vi.mock("../api/serviceBookings");

const pendingBooking = {
  id: "b1",
  customer_id: "c1",
  vehicle_id: "v1",
  service_type: "oil_change",
  preferred_date: "2030-01-15",
  notes: "Please check the brakes too.",
  status: "pending",
  created_at: "2026-07-20T10:00:00Z",
  vehicle_make: "Toyota",
  vehicle_model: "Fortuner",
  customer_email: "jane.doe@example.com",
  customer_name: "Jane Doe",
};

const confirmedBooking = {
  ...pendingBooking,
  id: "b2",
  status: "confirmed",
  customer_name: "John Smith",
  customer_email: "john.smith@example.com",
};

const cancelledBooking = { ...pendingBooking, id: "b3", status: "cancelled", customer_name: "Ann Lee" };
const completedBooking = { ...pendingBooking, id: "b4", status: "completed", customer_name: "Ray Kim" };

describe("AdminServiceBookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while bookings load", () => {
    listAllServiceBookings.mockImplementation(() => new Promise(() => {}));

    render(<AdminServiceBookings />);

    expect(screen.getByText(/loading service bookings/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no bookings", async () => {
    listAllServiceBookings.mockResolvedValue([]);

    render(<AdminServiceBookings />);

    expect(await screen.findByText(/no service bookings/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listAllServiceBookings.mockRejectedValue(new Error("network down"));

    render(<AdminServiceBookings />);

    expect(await screen.findByText(/couldn't load service bookings/i)).toBeInTheDocument();
  });

  it("lists bookings with customer, vehicle, service type, preferred date, and status", async () => {
    listAllServiceBookings.mockResolvedValue([pendingBooking]);

    render(<AdminServiceBookings />);

    expect(await screen.findByText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByText(/toyota fortuner/i)).toBeInTheDocument();
    expect(screen.getByText(/oil change/i)).toBeInTheDocument();
    expect(screen.getByText(/^pending$/i)).toBeInTheDocument();
  });

  it("confirms a pending booking", async () => {
    listAllServiceBookings.mockResolvedValue([pendingBooking]);
    setServiceBookingStatus.mockResolvedValue({ ...pendingBooking, status: "confirmed" });

    render(<AdminServiceBookings />);
    await screen.findByText(/jane doe/i);

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => expect(setServiceBookingStatus).toHaveBeenCalledWith("b1", "confirmed"));
    expect(await screen.findByText(/^confirmed$/i)).toBeInTheDocument();
  });

  it("cancels a pending booking", async () => {
    listAllServiceBookings.mockResolvedValue([pendingBooking]);
    setServiceBookingStatus.mockResolvedValue({ ...pendingBooking, status: "cancelled" });

    render(<AdminServiceBookings />);
    await screen.findByText(/jane doe/i);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(setServiceBookingStatus).toHaveBeenCalledWith("b1", "cancelled"));
    expect(await screen.findByText(/^cancelled$/i)).toBeInTheDocument();
  });

  it("marks a confirmed booking as completed and hides confirm/cancel for it", async () => {
    listAllServiceBookings.mockResolvedValue([confirmedBooking]);
    setServiceBookingStatus.mockResolvedValue({ ...confirmedBooking, status: "completed" });

    render(<AdminServiceBookings />);
    await screen.findByText(/john smith/i);

    expect(screen.queryByRole("button", { name: /^confirm$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /mark completed/i }));

    await waitFor(() => expect(setServiceBookingStatus).toHaveBeenCalledWith("b2", "completed"));
    expect(await screen.findByText(/^completed$/i)).toBeInTheDocument();
  });

  it("shows no actions for a cancelled or completed booking", async () => {
    listAllServiceBookings.mockResolvedValue([cancelledBooking, completedBooking]);

    render(<AdminServiceBookings />);
    await screen.findByText(/ann lee/i);

    expect(screen.queryByRole("button", { name: /^confirm$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^cancel$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
  });
});
