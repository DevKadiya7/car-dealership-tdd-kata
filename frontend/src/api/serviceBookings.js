import api from "./client";

export const createServiceBooking = (payload) =>
  api.post("/api/service-bookings", payload).then((r) => r.data);

export const listMyServiceBookings = () => api.get("/api/service-bookings/me").then((r) => r.data);

export const listAllServiceBookings = () => api.get("/api/service-bookings").then((r) => r.data);

export const setServiceBookingStatus = (id, status) =>
  api.patch(`/api/service-bookings/${id}/status`, { status }).then((r) => r.data);
