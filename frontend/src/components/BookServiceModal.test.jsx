import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import BookServiceModal from "./BookServiceModal";
import { listMyPurchases } from "../api/purchases";
import { createServiceBooking } from "../api/serviceBookings";

vi.mock("../api/purchases");
vi.mock("../api/serviceBookings");

const purchases = [
  { vehicle_id: "v1", vehicle_make: "Toyota", vehicle_model: "Fortuner" },
  { vehicle_id: "v1", vehicle_make: "Toyota", vehicle_model: "Fortuner" },
  { vehicle_id: "v2", vehicle_make: "Honda", vehicle_model: "City" },
];

function renderModal(props = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(<BookServiceModal onClose={onClose} onSuccess={onSuccess} {...props} />);
  return { onClose, onSuccess };
}

describe("BookServiceModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while the customer's vehicles load", () => {
    listMyPurchases.mockImplementation(() => new Promise(() => {}));

    renderModal();

    expect(screen.getByText(/loading your vehicles/i)).toBeInTheDocument();
  });

  it("populates the vehicle picker with distinct owned vehicles", async () => {
    listMyPurchases.mockResolvedValue(purchases);

    renderModal();

    const picker = await screen.findByLabelText(/vehicle/i);
    const options = Array.from(picker.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["Toyota Fortuner", "Honda City"]);
  });

  it("shows an empty state and disables submission when the customer owns no vehicles", async () => {
    listMyPurchases.mockResolvedValue([]);

    renderModal();

    expect(await screen.findByText(/haven't purchased any vehicles/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /book service/i })).not.toBeInTheDocument();
  });

  it("shows every service type as an option", async () => {
    listMyPurchases.mockResolvedValue(purchases);

    renderModal();

    const picker = await screen.findByLabelText(/service type/i);
    expect(picker).toHaveTextContent("Oil Change");
    expect(picker).toHaveTextContent("Brake Service");
    expect(picker).toHaveTextContent("Full Service");
  });

  it("shows a validation error for a preferred date in the past", async () => {
    listMyPurchases.mockResolvedValue(purchases);
    renderModal();
    await screen.findByLabelText(/vehicle/i);

    const dateInput = screen.getByLabelText(/preferred date/i);
    fireEvent.change(dateInput, { target: { value: "2020-01-01" } });
    await userEvent.click(screen.getByRole("button", { name: /book service/i }));

    expect(await screen.findByText(/cannot be in the past/i)).toBeInTheDocument();
    expect(createServiceBooking).not.toHaveBeenCalled();
  });

  it("books a service appointment with the selected vehicle, type, date, and notes", async () => {
    listMyPurchases.mockResolvedValue(purchases);
    createServiceBooking.mockResolvedValue({
      id: "b1",
      vehicle_id: "v2",
      service_type: "brake_service",
      preferred_date: "2030-01-15",
      notes: "Squeaky brakes",
      status: "pending",
    });
    const { onSuccess } = renderModal();
    await screen.findByLabelText(/vehicle/i);

    await userEvent.selectOptions(screen.getByLabelText(/vehicle/i), "v2");
    await userEvent.selectOptions(screen.getByLabelText(/service type/i), "brake_service");
    const dateInput = screen.getByLabelText(/preferred date/i);
    fireEvent.change(dateInput, { target: { value: "2030-01-15" } });
    await userEvent.type(screen.getByLabelText(/notes/i), "Squeaky brakes");
    await userEvent.click(screen.getByRole("button", { name: /book service/i }));

    expect(await screen.findByText(/booking confirmed|request submitted/i)).toBeInTheDocument();
    expect(createServiceBooking).toHaveBeenCalledWith({
      vehicle_id: "v2",
      service_type: "brake_service",
      preferred_date: "2030-01-15",
      notes: "Squeaky brakes",
    });
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b1", status: "pending" })
    );
  });

  it("shows a server error message when booking fails", async () => {
    listMyPurchases.mockResolvedValue(purchases);
    createServiceBooking.mockRejectedValue({
      response: { data: { detail: "You can only book service for a vehicle you've purchased" } },
    });
    renderModal();
    await screen.findByLabelText(/vehicle/i);

    await userEvent.click(screen.getByRole("button", { name: /book service/i }));

    expect(
      await screen.findByText(/you can only book service for a vehicle you've purchased/i)
    ).toBeInTheDocument();
  });
});
