import api from "./client";

export const listAdmins = () => api.get("/api/admin/admins").then((r) => r.data);

export const createAdmin = (payload) => api.post("/api/admin/admins", payload).then((r) => r.data);

export const updateAdmin = (id, payload) =>
  api.patch(`/api/admin/admins/${id}`, payload).then((r) => r.data);

export const resetAdminPassword = (id, newPassword) =>
  api.post(`/api/admin/admins/${id}/reset-password`, { new_password: newPassword }).then((r) => r.data);

export const setAdminStatus = (id, isActive) =>
  api.patch(`/api/admin/admins/${id}/status`, { is_active: isActive }).then((r) => r.data);
