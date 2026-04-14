import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CartPage from "./pages/CartPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className={isAdminPage ? "admin-app-shell" : "app-shell"}>
      {!isAuthPage && !isAdminPage && <Header />}
      <main
        className={
          isAuthPage ? "auth-main" : isAdminPage ? "admin-main" : "container app-main"
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <AdminCategoriesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProductsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute>
                <AdminPaymentsPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      {!isAuthPage && !isAdminPage && <Footer />}
    </div>
  );
}
