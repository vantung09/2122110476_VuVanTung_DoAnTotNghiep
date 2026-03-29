import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

function getStoredUser() {
  const token = localStorage.getItem("token");
  const fullName = localStorage.getItem("fullName");
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  if (!token) return null;

  return {
    token,
    fullName,
    email,
    role,
    userId,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());

  const login = (payload) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("fullName", payload.fullName);
    localStorage.setItem("email", payload.email);
    localStorage.setItem("role", payload.role);
    localStorage.setItem("userId", payload.userId);
    setUser(payload);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
