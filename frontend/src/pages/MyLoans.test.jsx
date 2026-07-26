import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import MyLoans from "./MyLoans";
import { listMyLoans } from "../api/loans";

vi.mock("../api/loans");

const pendingLoan = {
  id: "loan-1",
  vehicle_id: "v1",
  vehicle_make: "Toyota",
  vehicle_model: "Fortuner",
  loan_amount: "700000.00",
  down_payment: "300000.00",
  total_interest: "151608.80",
  monthly_emi: "14193.48",
  duration_years: 5,
  status: "pending",
  created_at: "2026-07-20T10:00:00Z",
};

const completedLoan = {
  ...pendingLoan,
  id: "loan-2",
  vehicle_make: "Honda",
  vehicle_model: "City",
  status: "completed",
};

describe("MyLoans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while loans load", () => {
    listMyLoans.mockImplementation(() => new Promise(() => {}));

    render(<MyLoans />);

    expect(screen.getByText(/loading loans/i)).toBeInTheDocument();
  });

  it("shows an empty state when the customer has no loans", async () => {
    listMyLoans.mockResolvedValue([]);

    render(<MyLoans />);

    expect(await screen.findByText(/no loans yet/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listMyLoans.mockRejectedValue(new Error("network down"));

    render(<MyLoans />);

    expect(await screen.findByText(/couldn't load your loans/i)).toBeInTheDocument();
  });

  it("lists the vehicle, loan amount, remaining balance, EMI, status, and purchase date", async () => {
    listMyLoans.mockResolvedValue([pendingLoan]);

    render(<MyLoans />);

    expect(await screen.findByText(/toyota fortuner/i)).toBeInTheDocument();
    expect(screen.getByText("₹7,00,000.00")).toBeInTheDocument();
    expect(screen.getByText("₹8,51,608.80")).toBeInTheDocument(); // remaining = loan_amount + total_interest
    expect(screen.getByText("₹14,193.48")).toBeInTheDocument();
    expect(screen.getByText(/^pending$/i)).toBeInTheDocument();
    expect(screen.getByText(new Date(pendingLoan.created_at).toLocaleDateString())).toBeInTheDocument();
  });

  it("shows a zero remaining balance for a completed loan", async () => {
    listMyLoans.mockResolvedValue([completedLoan]);

    render(<MyLoans />);

    await screen.findByText(/honda city/i);
    expect(screen.getByText("₹0.00")).toBeInTheDocument();
  });
});
