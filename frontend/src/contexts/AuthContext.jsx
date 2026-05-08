import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_EXPIRED_EVENT,
  clearStoredAuth,
  getStoredAuthUser,
  storeAuthUser,
} from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredAuthUser);

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const login = (payload) => {
    storeAuthUser(payload);
    setUser(payload);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const updateUser = (payload) => {
    if (!user) return;
    const nextUser = {
      ...user,
      ...payload,
    };
    storeAuthUser(nextUser);
    setUser(nextUser);
  };

  const value = useMemo(() => ({ user, login, logout, updateUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
