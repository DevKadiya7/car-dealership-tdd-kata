import api from "./client";

export const listCustomers = () => api.get("/api/admin/customers").then((r) => r.data);

export const setCustomerStatus = (id, isActive) =>
  api.patch(`/api/admin/customers/${id}/status`, { is_active: isActive }).then((r) => r.data);

export const deleteCustomer = (id) => api.delete(`/api/admin/customers/${id}`);
