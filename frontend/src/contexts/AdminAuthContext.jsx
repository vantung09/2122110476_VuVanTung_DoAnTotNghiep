import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAdminAuth, getStoredAdminUser, storeAdminAuth } from "../utils/adminAuthStorage";
import { clearStoredAuth, notifyAuthExpired } from "../utils/authStorage";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(getStoredAdminUser);

  const login = (payload) => {
    clearStoredAuth();
    notifyAuthExpired();
    storeAdminAuth(payload);
    setUser(payload);
  };

  const logout = () => {
    clearAdminAuth();
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
