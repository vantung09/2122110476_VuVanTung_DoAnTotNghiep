import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const adminLinks = [
  { to: "/admin", label: "Tổng quan", end: true },
  { to: "/admin/categories", label: "Danh mục" },
  { to: "/admin/products", label: "Sản phẩm" },
  { to: "/admin/users", label: "Người dùng" },
  { to: "/admin/orders", label: "Đơn hàng" },
  { to: "/admin/payments", label: "Thanh toán" },
];

export default function AdminShell({ title, subtitle, actions, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidepanel">
        <Link to="/admin" className="admin-brand">
          <span className="admin-brand-mark">tung</span>
          <span className="admin-brand-z">Z</span>
          <span className="admin-brand-o">O</span>
          <span className="admin-brand-n">N</span>
          <span className="admin-brand-e">E</span>
        </Link>
        <p className="admin-brand-copy">
          Trung tâm điều hành riêng cho sản phẩm, người dùng, đơn hàng và thanh toán.
        </p>

        <nav className="admin-side-nav">
          {adminLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-side-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-side-footer">
          <div className="admin-profile-chip">
            <span className="admin-profile-avatar">
              {(user?.fullName || "A").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user?.fullName || "Quản trị viên"}</strong>
              <p>{user?.email || "admin@tungzone.com"}</p>
            </div>
          </div>

          <div className="admin-side-actions">
            <button className="admin-ghost-button" type="button" onClick={handleLogout}>
              Đăng xuất
            </button>
            <Link to="/" className="admin-ghost-link">
              Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </aside>

      <section className="admin-stage">
        <header className="admin-topbar">
          <div className="admin-title-block">
            <span className="admin-eyebrow">KHU VỰC QUẢN TRỊ RIÊNG</span>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
            {actions ? <div className="admin-top-actions">{actions}</div> : null}
          </div>
        </header>

        <div className="admin-stage-body">{children}</div>
      </section>
    </div>
  );
}
