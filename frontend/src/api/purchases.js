import api from "./client";

export const listAllPurchases = () => api.get("/api/purchases").then((r) => r.data);
