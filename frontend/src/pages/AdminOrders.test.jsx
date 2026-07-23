import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminOrders from "./AdminOrders";
import { listAllPurchases } from "../api/purchases";

vi.mock("../api/purchases");

const order1 = {
  id: "11111111-1111-1111-1111-111111111111",
  user_id: "u1",
  vehicle_id: "v1",
  quantity: 1,
  total_price: "20000.00",
  purchased_at: "2026-07-10T10:00:00Z",
  payment_method: "upi",
  status: "completed",
  vehicle_make: "Toyota",
  vehicle_model: "Corolla",
  customer_email: "jane.doe@example.com",
  customer_name: "Jane Doe",
};

const order2 = {
  id: "22222222-2222-2222-2222-222222222222",
  user_id: "u2",
  vehicle_id: "v2",
  quantity: 2,
  total_price: "50000.00",
  purchased_at: "2026-07-20T10:00:00Z",
  payment_method: "cash",
  status: "pending",
  vehicle_make: "Honda",
  vehicle_model: "City",
  customer_email: "john.smith@example.com",
  customer_name: "John Smith",
};

describe("AdminOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while orders load", () => {
    listAllPurchases.mockImplementation(() => new Promise(() => {}));

    render(<AdminOrders />);

    expect(screen.getByText(/loading orders/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no orders", async () => {
    listAllPurchases.mockResolvedValue([]);

    render(<AdminOrders />);

    expect(await screen.findByText(/no orders/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listAllPurchases.mockRejectedValue(new Error("network down"));

    render(<AdminOrders />);

    expect(await screen.findByText(/couldn't load orders/i)).toBeInTheDocument();
  });

  it("lists orders with invoice number, customer, vehicle, payment method, GST, total, and status", async () => {
    listAllPurchases.mockResolvedValue([order1]);

    render(<AdminOrders />);

    expect(await screen.findByText(/INV-11111111/i)).toBeInTheDocument();
    expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByText(/jane\.doe@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText(/^upi$/i)).toBeInTheDocument();
    expect(screen.getByText(/₹3,600/)).toBeInTheDocument();
    expect(screen.getByText(/₹23,600/)).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText(/^completed$/i)).toBeInTheDocument();
  });

  it("searches orders by invoice, customer, email, or vehicle", async () => {
    listAllPurchases.mockResolvedValue([order1, order2]);

    render(<AdminOrders />);
    await screen.findByText(/jane doe/i);

    await userEvent.type(screen.getByPlaceholderText(/search orders/i), "honda");

    expect(screen.getByText(/john smith/i)).toBeInTheDocument();
    expect(screen.queryByText(/jane doe/i)).not.toBeInTheDocument();
  });

  it("filters orders by payment method", async () => {
    listAllPurchases.mockResolvedValue([order1, order2]);

    render(<AdminOrders />);
    await screen.findByText(/jane doe/i);

    await userEvent.selectOptions(screen.getByLabelText(/payment method/i), "cash");

    expect(screen.getByText(/john smith/i)).toBeInTheDocument();
    expect(screen.queryByText(/jane doe/i)).not.toBeInTheDocument();
  });

  it("filters orders by status", async () => {
    listAllPurchases.mockResolvedValue([order1, order2]);

    render(<AdminOrders />);
    await screen.findByText(/jane doe/i);

    await userEvent.selectOptions(screen.getByLabelText(/^order status/i), "pending");

    expect(screen.getByText(/john smith/i)).toBeInTheDocument();
    expect(screen.queryByText(/jane doe/i)).not.toBeInTheDocument();
  });

  it("filters orders by date range", async () => {
    listAllPurchases.mockResolvedValue([order1, order2]);

    render(<AdminOrders />);
    await screen.findByText(/jane doe/i);

    await userEvent.type(screen.getByLabelText(/from date/i), "2026-07-15");

    expect(screen.getByText(/john smith/i)).toBeInTheDocument();
    expect(screen.queryByText(/jane doe/i)).not.toBeInTheDocument();
  });

  it("sorts orders by highest amount", async () => {
    listAllPurchases.mockResolvedValue([order1, order2]);

    render(<AdminOrders />);
    await screen.findByText(/jane doe/i);

    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), "amount-desc");

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("John Smith");
  });

  it("paginates when there are more than one page of orders", async () => {
    const orders = Array.from({ length: 9 }, (_, i) => ({
      ...order1,
      id: `${i}${i}${i}${i}${i}${i}${i}${i}-1111-1111-1111-111111111111`,
      customer_name: `Customer ${String(i).padStart(2, "0")}`,
    }));
    listAllPurchases.mockResolvedValue(orders);

    render(<AdminOrders />);
    await screen.findByText(/Customer 00/i);

    expect(screen.queryByText(/Customer 08/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/Customer 08/i)).toBeInTheDocument();
  });

  it("opens an order details modal reusing the Invoice component with a print button", async () => {
    listAllPurchases.mockResolvedValue([order1]);

    render(<AdminOrders />);
    await screen.findByText(/jane doe/i);

    await userEvent.click(screen.getByRole("row", { name: /jane doe/i }));

    expect(await screen.findByText(/invoice number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
  });
});
