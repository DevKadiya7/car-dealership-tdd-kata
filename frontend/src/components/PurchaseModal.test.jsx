import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import PurchaseModal from "./PurchaseModal";
import { useAuth } from "../hooks/useAuth";
import { purchaseVehicle } from "../api/vehicles";
import { createLoan } from "../api/loans";

vi.mock("../hooks/useAuth");
vi.mock("../api/vehicles");
vi.mock("../api/loans");

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
    expect(screen.getByText("₹20,000.00")).toBeInTheDocument();
    expect(screen.getByText(/gst \(18%\)/i)).toBeInTheDocument();
    expect(screen.getByText("₹3,600.00")).toBeInTheDocument();
    expect(screen.getByText("₹23,600.00")).toBeInTheDocument();
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
    expect(purchaseVehicle).toHaveBeenCalledWith("v1", "credit");
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

describe("PurchaseModal - loan flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { first_name: "Jane", last_name: "Doe", email: "jane.doe@example.com" },
    });
  });

  it("defaults to Full Payment with the card fields visible", () => {
    renderModal();

    expect(screen.getByRole("radio", { name: /full payment/i })).toBeChecked();
    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
  });

  it("shows the loan fields and a live EMI summary when Loan is selected", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));

    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan duration/i)).toBeInTheDocument();
    expect(screen.getByText(/loan amount/i)).toBeInTheDocument();
    expect(screen.getByText(/interest rate/i)).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
    expect(screen.getByText(/estimated emi/i)).toBeInTheDocument();
    expect(screen.getByText(/total interest/i)).toBeInTheDocument();
    expect(screen.getByText(/total amount payable/i)).toBeInTheDocument();
  });

  it("pre-fills the down payment with the 30% minimum and computes the EMI for a 5-year term", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    expect(screen.getByLabelText(/down payment/i)).toHaveValue(6000);

    await userEvent.selectOptions(screen.getByLabelText(/loan duration/i), "5");

    expect(screen.getByText("₹14,000.00")).toBeInTheDocument(); // loan amount
    expect(screen.getByText("₹283.87")).toBeInTheDocument(); // EMI
    expect(screen.getByText("₹3,032.20")).toBeInTheDocument(); // total interest
    expect(screen.getByText("₹23,032.20")).toBeInTheDocument(); // total payable
  });

  it("recomputes the EMI when the down payment changes", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    await userEvent.selectOptions(screen.getByLabelText(/loan duration/i), "3");
    const downPaymentInput = screen.getByLabelText(/down payment/i);
    await userEvent.clear(downPaymentInput);
    await userEvent.type(downPaymentInput, "6000");

    expect(screen.getByText("₹438.71")).toBeInTheDocument(); // EMI for 14000 over 3 years
  });

  it("shows a validation error when down payment is below the 30% minimum", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    const downPaymentInput = screen.getByLabelText(/down payment/i);
    await userEvent.clear(downPaymentInput);
    await userEvent.type(downPaymentInput, "1000");
    await userEvent.click(screen.getByRole("button", { name: /apply for loan/i }));

    expect(await screen.findByText(/cannot be less than 30%/i)).toBeInTheDocument();
    expect(createLoan).not.toHaveBeenCalled();
  });

  it("shows a validation error when down payment exceeds the vehicle price", async () => {
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    const downPaymentInput = screen.getByLabelText(/down payment/i);
    await userEvent.clear(downPaymentInput);
    await userEvent.type(downPaymentInput, "25000");
    await userEvent.click(screen.getByRole("button", { name: /apply for loan/i }));

    expect(await screen.findByText(/cannot exceed the vehicle price/i)).toBeInTheDocument();
    expect(createLoan).not.toHaveBeenCalled();
  });

  it("submits a loan application and shows a success view with a View Invoice option", async () => {
    createLoan.mockResolvedValue({
      id: "loan1",
      down_payment: "6000.00",
      loan_amount: "14000.00",
      duration_years: 5,
      interest_rate: "8.00",
      monthly_emi: "283.87",
      total_interest: "3032.20",
      total_payable: "23032.20",
      status: "pending",
    });
    const { onSuccess } = renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    await userEvent.selectOptions(screen.getByLabelText(/loan duration/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /apply for loan/i }));

    expect(await screen.findByText(/purchase successful/i)).toBeInTheDocument();
    expect(createLoan).toHaveBeenCalledWith({
      vehicle_id: "v1",
      down_payment: 6000,
      duration_years: 5,
    });
    expect(onSuccess).toHaveBeenCalledWith({ ...vehicle, quantity: 4 });
    expect(screen.getByRole("button", { name: /view invoice/i })).toBeInTheDocument();
  });

  it("shows the invoice with a Loan Details section after a loan purchase", async () => {
    createLoan.mockResolvedValue({
      id: "loan1",
      down_payment: "6000.00",
      loan_amount: "14000.00",
      duration_years: 5,
      interest_rate: "8.00",
      monthly_emi: "283.87",
      total_interest: "3032.20",
      total_payable: "23032.20",
      status: "pending",
    });
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    await userEvent.selectOptions(screen.getByLabelText(/loan duration/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /apply for loan/i }));
    await screen.findByText(/purchase successful/i);

    await userEvent.click(screen.getByRole("button", { name: /view invoice/i }));

    expect(screen.getByText(/loan details/i)).toBeInTheDocument();
    expect(screen.getByText("₹283.87")).toBeInTheDocument();
  });

  it("shows a failure dialog when the loan application fails", async () => {
    createLoan.mockRejectedValue({
      response: { data: { detail: "Only 0 unit(s) left in stock" } },
    });
    renderModal();

    await userEvent.click(screen.getByRole("radio", { name: /^loan$/i }));
    await userEvent.click(screen.getByRole("button", { name: /apply for loan/i }));

    expect(await screen.findByText(/only 0 unit\(s\) left in stock/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
