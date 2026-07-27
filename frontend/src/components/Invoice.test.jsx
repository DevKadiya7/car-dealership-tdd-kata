import { render, screen } from "@testing-library/react";
import Invoice from "./Invoice";

const vehicle = { id: "v1234567", make: "Toyota", model: "Fortuner" };
const customer = { name: "Jane Doe", email: "jane.doe@example.com" };
const pricing = {
  originalPrice: 1000000,
  discountAmount: 100000,
  subtotal: 900000,
  gst: 162000,
  grandTotal: 1062000,
};

function renderInvoice(props = {}) {
  render(
    <Invoice
      vehicle={vehicle}
      customer={customer}
      pricing={pricing}
      paymentMethod="Credit Card"
      invoiceNumber="INV-000001"
      date="26/07/2026"
      {...props}
    />
  );
}

describe("Invoice", () => {
  it("shows the payment method and no loan section for a full payment", () => {
    renderInvoice();

    expect(screen.getByText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByText("Credit Card")).toBeInTheDocument();
    expect(screen.queryByText(/loan details/i)).not.toBeInTheDocument();
    expect(screen.getByText(/original price/i)).toBeInTheDocument();
    expect(screen.getByText("₹10,00,000.00")).toBeInTheDocument();
    expect(screen.getByText(/discount/i)).toBeInTheDocument();
    expect(screen.getByText("-₹1,00,000.00")).toBeInTheDocument();
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText("₹9,00,000.00")).toBeInTheDocument();
    expect(screen.getByText("₹1,62,000.00")).toBeInTheDocument();
    expect(screen.getByText(/final amount/i)).toBeInTheDocument();
    expect(screen.getByText("₹10,62,000.00")).toBeInTheDocument();
  });

  it("shows a Loan Details section with down payment, loan amount, duration, interest, and EMI", () => {
    renderInvoice({
      paymentMethod: "Loan",
      loan: {
        down_payment: 300000,
        loan_amount: 700000,
        duration_years: 5,
        interest_rate: 8,
        monthly_emi: 14193.48,
        total_interest: 151608.8,
        total_payable: 1151608.8,
      },
    });

    expect(screen.getByText("Loan")).toBeInTheDocument();
    expect(screen.getByText(/loan details/i)).toBeInTheDocument();
    expect(screen.getByText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByText("₹3,00,000.00")).toBeInTheDocument();
    expect(screen.getByText(/loan amount/i)).toBeInTheDocument();
    expect(screen.getByText("₹7,00,000.00")).toBeInTheDocument();
    expect(screen.getByText(/duration/i)).toBeInTheDocument();
    expect(screen.getByText(/5 years/i)).toBeInTheDocument();
    expect(screen.getByText(/interest rate/i)).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
    expect(screen.getByText(/monthly emi/i)).toBeInTheDocument();
    expect(screen.getByText("₹14,193.48")).toBeInTheDocument();
    expect(screen.getByText(/total interest/i)).toBeInTheDocument();
    expect(screen.getByText("₹1,51,608.80")).toBeInTheDocument();
    expect(screen.getByText(/total amount payable/i)).toBeInTheDocument();
    expect(screen.getByText("₹11,51,608.80")).toBeInTheDocument();
  });
});
