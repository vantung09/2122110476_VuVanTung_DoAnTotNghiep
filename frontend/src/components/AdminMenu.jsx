import { NavLink } from "react-router-dom";

export default function AdminMenu() {
  return (
    <aside className="admin-sidebar">
      <h3>Quản trị</h3>
      <nav className="admin-nav">
        <NavLink to="/admin">Tổng quan</NavLink>
        <NavLink to="/admin/products">Sản phẩm</NavLink>
        <NavLink to="/admin/users">Người dùng</NavLink>
        <NavLink to="/admin/orders">Đơn hàng</NavLink>
      </nav>
    </aside>
  );
}
