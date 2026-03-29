import { Link } from "react-router-dom";
import AdminMenu from "../../components/AdminMenu";

export default function AdminDashboardPage() {
  return (
    <div className="admin-layout">
      <AdminMenu />
      <section className="admin-content">
        <div className="card p-lg">
          <h1>Bảng điều khiển quản trị</h1>
          <p className="muted">
            Quản lý sản phẩm, người dùng và đơn hàng tại đây.
          </p>
        </div>

        <div className="admin-cards">
          <Link to="/admin/products" className="card admin-shortcut">
            <h3>Sản phẩm</h3>
            <p>Thêm, sửa, xóa sản phẩm</p>
          </Link>
          <Link to="/admin/users" className="card admin-shortcut">
            <h3>Người dùng</h3>
            <p>Quản lý tài khoản và quyền</p>
          </Link>
          <Link to="/admin/orders" className="card admin-shortcut">
            <h3>Đơn hàng</h3>
            <p>Cập nhật trạng thái đơn</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
