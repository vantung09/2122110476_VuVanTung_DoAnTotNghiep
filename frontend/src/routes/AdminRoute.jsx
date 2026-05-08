import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAdminAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}
