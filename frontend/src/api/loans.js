import api from "./client";

export const createLoan = (payload) => api.post("/api/loans", payload).then((r) => r.data);

export const listMyLoans = () => api.get("/api/loans/me").then((r) => r.data);

export const listAllLoans = () => api.get("/api/loans").then((r) => r.data);

export const setLoanStatus = (id, status) =>
  api.patch(`/api/loans/${id}/status`, { status }).then((r) => r.data);
