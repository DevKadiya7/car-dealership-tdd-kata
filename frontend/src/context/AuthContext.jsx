import { createContext, useState, useCallback } from "react";
import api from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const fetchAndStoreUser = useCallback(async () => {
    const { data } = await api.get("/api/auth/me");
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data } = await api.post("/api/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token);
        await fetchAndStoreUser();
      } finally {
        setLoading(false);
      }
    },
    [fetchAndStoreUser]
  );

  const register = useCallback(async (profile) => {
    setLoading(true);
    try {
      await api.post("/api/auth/register", profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
