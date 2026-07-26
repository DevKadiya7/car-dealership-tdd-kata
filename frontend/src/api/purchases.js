import api from "./client";

export const listAllPurchases = () => api.get("/api/purchases").then((r) => r.data);

export const listMyPurchases = () => api.get("/api/purchases/me").then((r) => r.data);
