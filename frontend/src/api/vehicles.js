import api from "./client";

export const VEHICLE_CATEGORIES = [
  "sedan",
  "suv",
  "truck",
  "coupe",
  "convertible",
  "hatchback",
  "van",
  "electric",
];

export const listVehicles = () => api.get("/api/vehicles").then((r) => r.data);

export const getVehicle = (id) => api.get(`/api/vehicles/${id}`).then((r) => r.data);

export const searchVehicles = (params) =>
  api.get("/api/vehicles/search", { params }).then((r) => r.data);

export const addVehicle = (vehicle) => api.post("/api/vehicles", vehicle).then((r) => r.data);

export const updateVehicle = (id, changes) =>
  api.put(`/api/vehicles/${id}`, changes).then((r) => r.data);

export const deleteVehicle = (id) => api.delete(`/api/vehicles/${id}`);

export const purchaseVehicle = (id) =>
  api.post(`/api/vehicles/${id}/purchase`).then((r) => r.data);

export const restockVehicle = (id) =>
  api.post(`/api/vehicles/${id}/restock`).then((r) => r.data);
