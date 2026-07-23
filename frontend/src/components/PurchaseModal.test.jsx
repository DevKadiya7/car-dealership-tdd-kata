import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import PurchaseModal from "./PurchaseModal";
import { useAuth } from "../hooks/useAuth";
import { purchaseVehicle } from "../api/vehicles";

vi.mock("../hooks/useAuth");
vi.mock("../api/vehicles");

const vehicle = {
  id: "v1",
  make: "Toyota",
  model: "Corolla",
  category: "sedan",
  price: "20000.00",
  quantity: 5,
};

function renderModal(props = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(<PurchaseModal vehicle={vehicle} onClose={onClose} onSuccess={onSuccess} {...props} />);
  return { onClose, onSuccess };
}

describe("PurchaseModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { first_name: "Jane", last_name: "Doe", email: "jane.doe@example.com" },
    });
  });

  it("shows customer, vehicle, price, GST, and grand total in the order summary", () => {
    renderModal();

    expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByText(/jane\.doe@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument();
    expect(screen.getByText("$20,000.00")).toBeInTheDocument();
    expect(screen.getByText(/gst \(18%\)/i)).toBeInTheDocument();
    expect(screen.getByText("$3,600.00")).toBeInTheDocument();
    expect(screen.getByText("$23,600.00")).toBeInTheDocument();
  });

  it("defaults to Credit Card and shows the card fields", () => {
    renderModal();

    expect(screen.getByRole("radio", { name: /credit card/i })).toBeChecked();
    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/card holder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
  });

  it("shows the UPI ID field and hides card fields when UPI is selected", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^upi$/i }));

    expect(screen.getByLabelText(/upi id/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
  });

  it("shows no extra fields for Cash (Demo)", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /cash/i }));

    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/upi id/i)).not.toBeInTheDocument();
  });

  it("shows validation errors for an incomplete card form on submit", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("button", { name: /confirm purchase/i }));

    expect(await screen.findByText(/card number is required/i)).toBeInTheDocument();
    expect(purchaseVehicle).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid UPI ID", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("radio", { name: /^upi$/i }));
    await userEvent.type(screen.getByLabelText(/upi id/i), "not-a-upi-id");
    await userEvent.click(screen.getByRole("button", { name: /confirm purchase/i }));

    expect(await screen.findByText(/enter a valid upi id/i)).toBeInTheDocument();
    expect(purchaseVehicle).not.toHaveBeenCalled();
  });

  it("purchases the vehicle and shows a success view with a View Invoice option", async () => {
    purchaseVehicle.mockResolvedValue({ ...vehicle, quantity: 4 });
    const { onSuccess } = renderModal();

    await userEvent.type(screen.getByLabelText(/card number/i), "4111111111111111");
    await userEvent.type(screen.getByLabelText(/card holder/i), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/expiry/i), "12/30");
    await userEvent.type(screen.getByLabelText(/cvv/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /confirm purchase/i }));

    expect(await screen.findByText(/purchase successful/i)).toBeInTheDocument();
    expect(purchaseVehicle).toHaveBeenCalledWith("v1");
    expect(onSuccess).toHaveBeenCalledWith({ ...vehicle, quantity: 4 });
    expect(screen.getByRole("button", { name: /view invoice/i })).toBeInTheDocument();
  });

  it("shows the invoice with a GST breakdown when View Invoice is clicked", async () => {
    purchaseVehicle.mockResolvedValue({ ...vehicle, quantity: 4 });
    renderModal();

    await userEvent.type(screen.getByLabelText(/card number/i), "4111111111111111");
    await userEvent.type(screen.getByLabelText(/card holder/i), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/expiry/i), "12/30");
    await userEvent.type(screen.getByLabelText(/cvv/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /confirm purchase/i }));
    await screen.findByText(/purchase successful/i);

    await userEvent.click(screen.getByRole("button", { name: /view invoice/i }));

    expect(screen.getByText(/invoice/i)).toBeInTheDocument();
    expect(screen.getByText(/invoice number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  it("shows a failure dialog with the error message when the purchase fails, and allows retry", async () => {
    purchaseVehicle.mockRejectedValue({
      response: { data: { detail: "Only 0 unit(s) left in stock" } },
    });
    renderModal();

    await userEvent.type(screen.getByLabelText(/card number/i), "4111111111111111");
    await userEvent.type(screen.getByLabelText(/card holder/i), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/expiry/i), "12/30");
    await userEvent.type(screen.getByLabelText(/cvv/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /confirm purchase/i }));

    expect(await screen.findByText(/only 0 unit\(s\) left in stock/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
