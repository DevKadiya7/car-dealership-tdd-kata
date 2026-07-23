import api from "./client";

// All six of these hit admin-only endpoints (require_admin on the
// backend) - a 403 here means the logged-in user genuinely isn't an
// admin, not a bug in this client.

export const getDashboardSummary = () => api.get("/api/dashboard/summary").then((r) => r.data);

export const getRecentPurchases = () =>
  api.get("/api/dashboard/recent-purchases").then((r) => r.data);

export const getTopSelling = () => api.get("/api/dashboard/top-selling").then((r) => r.data);

export const getLowStock = () => api.get("/api/dashboard/low-stock").then((r) => r.data);

export const getSalesByCategory = () =>
  api.get("/api/dashboard/sales-by-category").then((r) => r.data);

export const getMonthlySales = () => api.get("/api/dashboard/monthly-sales").then((r) => r.data);
