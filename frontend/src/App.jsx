import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";

const ProductAssistant = lazy(() => import("./components/ProductAssistant"));
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const SharedWishlistPage = lazy(() => import("./pages/SharedWishlistPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));

function RouteFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      Đang tải...
    </div>
  );
}

function DeferredProductAssistant() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const showAssistant = () => {
      if (!cancelled) setReady(true);
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(showAssistant, { timeout: 1800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const id = window.setTimeout(showAssistant, 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <ProductAssistant />
    </Suspense>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
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
  );
}

function StorefrontRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/tracking" element={<OrderTrackingPage />} />
      <Route path="/wishlist/:slug" element={<SharedWishlistPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/";

  if (isAdminPage) {
    return (
      <AdminAuthProvider>
        <div className="admin-app-shell">
          <main className="admin-main">
            <Suspense fallback={<RouteFallback />}>
              <AdminRoutes />
            </Suspense>
          </main>
        </div>
      </AdminAuthProvider>
    );
  }

  return (
    <div className="app-shell">
      {!isAuthPage && <Header />}
      <main className={isAuthPage ? "auth-main" : isHomePage ? "app-main" : "container app-main"}>
        <Suspense fallback={<RouteFallback />}>
          <StorefrontRoutes />
        </Suspense>
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <DeferredProductAssistant />}
    </div>
  );
}
