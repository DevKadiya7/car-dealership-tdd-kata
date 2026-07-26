import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminLoans from "./AdminLoans";
import { listAllLoans, setLoanStatus } from "../api/loans";

vi.mock("../api/loans");

const pendingLoan = {
  id: "loan-1",
  purchase_id: "p1",
  customer_id: "c1",
  vehicle_id: "v1",
  vehicle_price: "1000000.00",
  down_payment: "300000.00",
  loan_amount: "700000.00",
  interest_rate: "8.00",
  duration_years: 5,
  monthly_emi: "14193.48",
  total_interest: "151608.80",
  total_payable: "1151608.80",
  status: "pending",
  created_at: "2026-07-20T10:00:00Z",
  vehicle_make: "Toyota",
  vehicle_model: "Fortuner",
  customer_email: "jane.doe@example.com",
  customer_name: "Jane Doe",
};

const approvedLoan = {
  ...pendingLoan,
  id: "loan-2",
  status: "approved",
  customer_name: "John Smith",
  customer_email: "john.smith@example.com",
};

const rejectedLoan = { ...pendingLoan, id: "loan-3", status: "rejected", customer_name: "Ann Lee" };
const completedLoan = { ...pendingLoan, id: "loan-4", status: "completed", customer_name: "Ray Kim" };

describe("AdminLoans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while loans load", () => {
    listAllLoans.mockImplementation(() => new Promise(() => {}));

    render(<AdminLoans />);

    expect(screen.getByText(/loading loans/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no loans", async () => {
    listAllLoans.mockResolvedValue([]);

    render(<AdminLoans />);

    expect(await screen.findByText(/no loan applications/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listAllLoans.mockRejectedValue(new Error("network down"));

    render(<AdminLoans />);

    expect(await screen.findByText(/couldn't load loans/i)).toBeInTheDocument();
  });

  it("lists loans with customer, vehicle, loan amount, duration, EMI, and status", async () => {
    listAllLoans.mockResolvedValue([pendingLoan]);

    render(<AdminLoans />);

    expect(await screen.findByText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByText(/toyota fortuner/i)).toBeInTheDocument();
    expect(screen.getByText("₹7,00,000.00")).toBeInTheDocument();
    expect(screen.getByText(/5 years/i)).toBeInTheDocument();
    expect(screen.getByText("₹14,193.48")).toBeInTheDocument();
    expect(screen.getByText(/^pending$/i)).toBeInTheDocument();
  });

  it("shows Approve and Reject actions for a pending loan and approves it", async () => {
    listAllLoans.mockResolvedValue([pendingLoan]);
    setLoanStatus.mockResolvedValue({ ...pendingLoan, status: "approved" });

    render(<AdminLoans />);
    await screen.findByText(/jane doe/i);

    await userEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(setLoanStatus).toHaveBeenCalledWith("loan-1", "approved"));
    expect(await screen.findByText(/^approved$/i)).toBeInTheDocument();
  });

  it("rejects a pending loan", async () => {
    listAllLoans.mockResolvedValue([pendingLoan]);
    setLoanStatus.mockResolvedValue({ ...pendingLoan, status: "rejected" });

    render(<AdminLoans />);
    await screen.findByText(/jane doe/i);

    await userEvent.click(screen.getByRole("button", { name: /reject/i }));

    await waitFor(() => expect(setLoanStatus).toHaveBeenCalledWith("loan-1", "rejected"));
    expect(await screen.findByText(/^rejected$/i)).toBeInTheDocument();
  });

  it("shows a Mark Completed action for an approved loan and completes it", async () => {
    listAllLoans.mockResolvedValue([approvedLoan]);
    setLoanStatus.mockResolvedValue({ ...approvedLoan, status: "completed" });

    render(<AdminLoans />);
    await screen.findByText(/john smith/i);

    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /mark completed/i }));

    await waitFor(() => expect(setLoanStatus).toHaveBeenCalledWith("loan-2", "completed"));
    expect(await screen.findByText(/^completed$/i)).toBeInTheDocument();
  });

  it("shows no actions for a rejected or completed loan", async () => {
    listAllLoans.mockResolvedValue([rejectedLoan, completedLoan]);

    render(<AdminLoans />);
    await screen.findByText(/ann lee/i);

    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
  });
});
