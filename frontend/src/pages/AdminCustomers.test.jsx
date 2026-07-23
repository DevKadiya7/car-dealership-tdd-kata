import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminCustomers from "./AdminCustomers";
import { listCustomers, setCustomerStatus, deleteCustomer } from "../api/customers";

vi.mock("../api/customers");

const activeCustomer = {
  id: "c1",
  email: "jane.doe@example.com",
  first_name: "Jane",
  last_name: "Doe",
  mobile_number: "9876543210",
  avatar_url: "https://example.com/jane.jpg",
  created_at: "2026-01-15T10:00:00Z",
  is_active: true,
  total_purchases: 3,
  total_spent: "150000.00",
};

const disabledCustomer = {
  id: "c2",
  email: "john.smith@example.com",
  first_name: "John",
  last_name: "Smith",
  mobile_number: "9123456780",
  avatar_url: null,
  created_at: "2026-02-01T10:00:00Z",
  is_active: false,
  total_purchases: 0,
  total_spent: "0.00",
};

describe("AdminCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it("shows a loading state while customers load", () => {
    listCustomers.mockImplementation(() => new Promise(() => {}));

    render(<AdminCustomers />);

    expect(screen.getByText(/loading customers/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no customers", async () => {
    listCustomers.mockResolvedValue([]);

    render(<AdminCustomers />);

    expect(await screen.findByText(/no customers/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listCustomers.mockRejectedValue(new Error("network down"));

    render(<AdminCustomers />);

    expect(await screen.findByText(/couldn't load customers/i)).toBeInTheDocument();
  });

  it("lists customers with email, mobile, registration date, purchases, spend, and status", async () => {
    listCustomers.mockResolvedValue([activeCustomer, disabledCustomer]);

    render(<AdminCustomers />);

    expect(await screen.findByText(/jane\.doe@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/9876543210/)).toBeInTheDocument();
    expect(screen.getByText(/jan 15, 2026|15 jan 2026|1\/15\/2026/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/₹1,50,000/)).toBeInTheDocument();
    expect(screen.getByText(/^active$/i)).toBeInTheDocument();
    expect(screen.getByText(/^disabled$/i)).toBeInTheDocument();
  });

  it("filters customers by search text", async () => {
    listCustomers.mockResolvedValue([activeCustomer, disabledCustomer]);

    render(<AdminCustomers />);
    await screen.findByText(/jane\.doe@example\.com/i);

    await userEvent.type(screen.getByPlaceholderText(/search customers/i), "jane");

    expect(screen.getByText(/jane\.doe@example\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/john\.smith@example\.com/i)).not.toBeInTheDocument();
  });

  it("shows an avatar image when present and initials fallback otherwise", async () => {
    listCustomers.mockResolvedValue([activeCustomer, disabledCustomer]);

    render(<AdminCustomers />);
    await screen.findByText(/jane\.doe@example\.com/i);

    expect(screen.getByRole("img", { name: /jane doe/i })).toHaveAttribute(
      "src",
      "https://example.com/jane.jpg"
    );
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("opens a profile modal with additional details when View Profile is clicked", async () => {
    listCustomers.mockResolvedValue([activeCustomer]);

    render(<AdminCustomers />);
    await screen.findByText(/jane\.doe@example\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /view profile/i }));

    expect(screen.getByRole("heading", { name: /jane doe/i })).toBeInTheDocument();
    expect(screen.getAllByText(/jane\.doe@example\.com/i).length).toBeGreaterThan(0);
  });

  it("disables a customer account when Disable is clicked", async () => {
    listCustomers.mockResolvedValue([activeCustomer]);
    setCustomerStatus.mockResolvedValue({ ...activeCustomer, is_active: false });

    render(<AdminCustomers />);
    await screen.findByText(/jane\.doe@example\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /disable/i }));

    await waitFor(() => expect(setCustomerStatus).toHaveBeenCalledWith("c1", false));
  });

  it("enables a disabled customer account when Enable is clicked", async () => {
    listCustomers.mockResolvedValue([disabledCustomer]);
    setCustomerStatus.mockResolvedValue({ ...disabledCustomer, is_active: true });

    render(<AdminCustomers />);
    await screen.findByText(/john\.smith@example\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /enable/i }));

    await waitFor(() => expect(setCustomerStatus).toHaveBeenCalledWith("c2", true));
  });

  it("deletes a customer after confirmation", async () => {
    listCustomers.mockResolvedValue([activeCustomer]);
    deleteCustomer.mockResolvedValue({});

    render(<AdminCustomers />);
    await screen.findByText(/jane\.doe@example\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteCustomer).toHaveBeenCalledWith("c1"));
    expect(await screen.findByText(/no customers/i)).toBeInTheDocument();
  });

  it("paginates when there are more than one page of customers", async () => {
    const customers = Array.from({ length: 12 }, (_, i) => ({
      ...activeCustomer,
      id: `c${i}`,
      email: `customer${String(i).padStart(2, "0")}@example.com`,
    }));
    listCustomers.mockResolvedValue(customers);

    render(<AdminCustomers />);
    await screen.findByText(/customer00@example\.com/i);

    expect(screen.queryByText(/customer10@example\.com/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/customer10@example\.com/i)).toBeInTheDocument();
  });
});
