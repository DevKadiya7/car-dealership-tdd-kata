import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";
import * as dashboardApi from "../api/dashboard";

vi.mock("../api/dashboard");

// These mocks mirror the REAL backend response shapes exactly, verified
// by calling the live endpoints against a test DB (see app/schemas/dashboard.py
// and app/schemas/vehicle.py). Decimal fields (price, revenue, total_price)
// serialize as strings (e.g. "49999.00"), not numbers - that's Pydantic's
// default JSON encoding for Decimal, confirmed against the running API.

// DashboardSummary: total_customers, total_vehicles, total_stock,
// total_sales (a COUNT of purchases, not a currency amount), total_revenue
// (the actual currency figure), low_stock_count.
const mockSummary = {
  total_customers: 18,
  total_vehicles: 42,
  total_stock: 210,
  total_sales: 124,
  total_revenue: "3124000.00",
  low_stock_count: 3,
};

// RecentPurchaseOut has no combined "customer" name field (the backend
// has no `name` column on User) and no "vehicle" combined string (Vehicle
// has no `year` field) - it's vehicle_make/vehicle_model and customer_email.
const mockRecentPurchases = [
  {
    id: "purchase-1",
    vehicle_id: "vehicle-1",
    vehicle_make: "Tesla",
    vehicle_model: "Model 3",
    customer_email: "nina.patel@example.com",
    quantity: 1,
    price: "49999.00",
    purchase_date: "2026-07-15T10:00:00Z",
  },
  {
    id: "purchase-2",
    vehicle_id: "vehicle-2",
    vehicle_make: "Ford",
    vehicle_model: "F-150",
    customer_email: "liam.chen@example.com",
    quantity: 1,
    price: "58999.00",
    purchase_date: "2026-07-14T10:00:00Z",
  },
];

// TopSellingVehicleOut: make/model separate, units_sold (not "sold"), revenue.
const mockTopSelling = [
  { vehicle_id: "vehicle-3", make: "Honda", model: "Civic", units_sold: 23, revenue: "654000.00" },
  { vehicle_id: "vehicle-4", make: "Toyota", model: "RAV4", units_sold: 11, revenue: "540000.00" },
];

// Low stock reuses VehicleOut directly (GET /api/dashboard/low-stock
// returns list[VehicleOut]) - id/make/model/category/price/quantity.
// No "vehicle" combined string field exists on this schema.
const mockLowStock = [
  { id: "vehicle-5", make: "Mazda", model: "CX-5", category: "suv", price: "28000.00", quantity: 2 },
  { id: "vehicle-6", make: "Nissan", model: "Leaf", category: "electric", price: "27000.00", quantity: 1 },
];

// SalesByCategoryOut: units_sold + revenue (not "sales"). Category is
// stored lowercase in the DB (see app/utils/constants.py VEHICLE_CATEGORIES).
const mockSalesByCategory = [
  { category: "suv", units_sold: 40, revenue: "820000.00" },
  { category: "sedan", units_sold: 22, revenue: "420000.00" },
];

// MonthlySalesOut: the backend uses Python's calendar.month_name, which
// gives FULL month names ("January"), never abbreviations ("Jan").
// Also: this endpoint always returns exactly 12 rows (Jan-Dec), even with
// zero purchases - app/repositories/dashboard_repository.py builds the
// list via range(1, 13) regardless of data. It is never literally "empty".
const mockMonthlySales = [
  { month: "January", revenue: "210000.00", total_purchases: 12 },
  { month: "February", revenue: "280000.00", total_purchases: 15 },
];

describe("Admin dashboard analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "Admin Dashboard", "/admin/dashboard");
    localStorage.setItem("access_token", "fake-token");
    // Real backend role values are "admin" / "customer" (see UserRole
    // enum in app/models/user.py) - there is no "user" role. isAdmin in
    // AuthContext only ever checks `=== "admin"`.
    localStorage.setItem("user", JSON.stringify({ email: "admin@company.com", role: "admin" }));

    dashboardApi.getDashboardSummary.mockResolvedValue(mockSummary);
    dashboardApi.getRecentPurchases.mockResolvedValue(mockRecentPurchases);
    dashboardApi.getTopSelling.mockResolvedValue(mockTopSelling);
    dashboardApi.getLowStock.mockResolvedValue(mockLowStock);
    dashboardApi.getSalesByCategory.mockResolvedValue(mockSalesByCategory);
    dashboardApi.getMonthlySales.mockResolvedValue(mockMonthlySales);
  });

  it("loads summary cards", async () => {
    render(<App />);

    expect(await screen.findByText(/Total Customers/i)).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText(/Total Sales/i)).toBeInTheDocument();
    expect(screen.getByText("124")).toBeInTheDocument();
    expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/3,124,000/)).toBeInTheDocument();
  });

  it("loads recent purchases", async () => {
    render(<App />);

    expect(await screen.findByText(/Recent Purchases/i)).toBeInTheDocument();
    expect(screen.getByText(/nina\.patel@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Tesla Model 3/i)).toBeInTheDocument();
  });

  it("loads top selling vehicles", async () => {
    render(<App />);

    expect(await screen.findByText(/Top Selling/i)).toBeInTheDocument();
    expect(screen.getByText(/Honda Civic/i)).toBeInTheDocument();
  });

  it("loads low stock vehicles", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Low Stock Vehicles/i })).toBeInTheDocument();
    expect(screen.getByText(/Mazda CX-5/i)).toBeInTheDocument();
  });

  it("loads sales by category chart", async () => {
    render(<App />);

    expect(await screen.findByText(/Sales by Category/i)).toBeInTheDocument();
    expect(screen.getAllByText(/suv/i).length).toBeGreaterThan(0);
  });

  it("loads monthly sales chart", async () => {
    render(<App />);

    expect(await screen.findByText(/Monthly Sales/i)).toBeInTheDocument();
    expect(screen.getByText(/January/i)).toBeInTheDocument();
  });

  it("shows a loading spinner while dashboard data loads", async () => {
    dashboardApi.getDashboardSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSummary), 200))
    );

    render(<App />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    expect(await screen.findByText(/Admin Panel/i)).toBeInTheDocument();
  });

  it("shows an error state when the dashboard API fails", async () => {
    dashboardApi.getDashboardSummary.mockRejectedValue(new Error("Server error"));

    render(<App />);

    expect(await screen.findByText(/Failed to load dashboard/i)).toBeInTheDocument();
  });

  it("shows an empty state when there is no dashboard activity yet", async () => {
    // monthly-sales always returns 12 rows by design (see comment above),
    // so "empty" is judged by total_sales === 0, not by every array being
    // literally empty - the UI should treat a zero-activity summary as
    // the empty state even though monthly-sales still returns 12 zeroed rows.
    dashboardApi.getDashboardSummary.mockResolvedValue({
      total_customers: 0,
      total_vehicles: 0,
      total_stock: 0,
      total_sales: 0,
      total_revenue: "0.00",
      low_stock_count: 0,
    });
    dashboardApi.getRecentPurchases.mockResolvedValue([]);
    dashboardApi.getTopSelling.mockResolvedValue([]);
    dashboardApi.getLowStock.mockResolvedValue([]);
    dashboardApi.getSalesByCategory.mockResolvedValue([]);
    dashboardApi.getMonthlySales.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2026, i, 1).toLocaleString("en-US", { month: "long" }),
        revenue: "0.00",
        total_purchases: 0,
      }))
    );

    render(<App />);

    expect(await screen.findByText(/No dashboard data available/i)).toBeInTheDocument();
  });

  it("redirects non-admin users away from the admin dashboard", async () => {
    // Real non-admin role value is "customer", not "user".
    localStorage.setItem("user", JSON.stringify({ email: "user@company.com", role: "customer" }));

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/");
    });
  });
});
