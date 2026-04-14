import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

function normalizeCategory(value) {
  return String(value || "Khác").trim() || "Khác";
}

function buildLast7DaysRevenue(orders) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      total: 0,
    };
  });

  const revenueMap = new Map(days.map((item) => [item.key, item]));

  orders
    .filter((order) => order.status === "COMPLETED")
    .forEach((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;

      const key = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
        .toISOString()
        .slice(0, 10);

      const target = revenueMap.get(key);
      if (target) {
        target.total += Number(order.totalAmount || 0);
      }
    });

  return days;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      try {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          axiosClient.get("/admin/users"),
          axiosClient.get("/admin/products"),
          axiosClient.get("/admin/orders"),
        ]);

        if (!mounted) return;

        setUsers(usersRes.data || []);
        setProducts(productsRes.data || []);
        setOrders(ordersRes.data || []);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || "Không tải được dữ liệu quản trị.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const activeProducts = products.filter((item) => item.active).length;
  const lowStockProducts = products.filter((item) => Number(item.stock || 0) <= 5).length;
  const pendingOrders = orders.filter((item) => item.status === "PENDING").length;
  const completedOrders = orders.filter((item) => item.status === "COMPLETED").length;
  const totalRevenue = orders
    .filter((item) => item.status === "COMPLETED")
    .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

  const latestUsers = useMemo(() => users.slice(0, 5), [users]);
  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const latestProducts = useMemo(
    () => [...products].sort((left, right) => Number(right.id || 0) - Number(left.id || 0)).slice(0, 4),
    [products]
  );

  const orderStatusData = useMemo(() => {
    const total = orders.length || 1;

    return ORDER_STATUSES.map((status) => {
      const count = orders.filter((order) => order.status === status).length;
      return {
        label: status,
        count,
        percentage: Math.round((count / total) * 100),
      };
    }).filter((item) => item.count > 0);
  }, [orders]);

  const categoryData = useMemo(() => {
    const groups = products.reduce((accumulator, product) => {
      const category = normalizeCategory(product.category);
      accumulator[category] = (accumulator[category] || 0) + 1;
      return accumulator;
    }, {});

    const max = Math.max(1, ...Object.values(groups));

    return Object.entries(groups)
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / max) * 100),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [products]);

  const revenue7Days = useMemo(() => buildLast7DaysRevenue(orders), [orders]);
  const maxRevenue = Math.max(1, ...revenue7Days.map((item) => item.total));

  return (
    <AdminShell
      title="Trung tâm quản trị"
      subtitle="Không gian quản trị riêng của TungZone, tách biệt hoàn toàn với giao diện mua sắm dành cho khách hàng."
    >
      {loading ? (
        <div className="admin-empty-state">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : (
        <div className="admin-page-grid">
          <section className="admin-stat-grid">
            <article className="admin-stat-card gradient-blue">
              <span className="admin-stat-label">Người dùng</span>
              <strong>{users.length}</strong>
              <p>Tổng số tài khoản hiện có trong hệ thống.</p>
            </article>
            <article className="admin-stat-card gradient-green">
              <span className="admin-stat-label">Sản phẩm</span>
              <strong>{activeProducts}</strong>
              <p>Số sản phẩm đang được hiển thị trên website.</p>
            </article>
            <article className="admin-stat-card gradient-gold">
              <span className="admin-stat-label">Đơn hàng</span>
              <strong>{orders.length}</strong>
              <p>Tổng số đơn hàng đã được tạo từ website.</p>
            </article>
            <article className="admin-stat-card gradient-pink">
              <span className="admin-stat-label">Doanh thu</span>
              <strong>{formatCurrency(totalRevenue)}</strong>
              <p>Chỉ tính từ các đơn hàng đã hoàn tất trong hệ thống.</p>
            </article>
          </section>

          <section className="admin-surface admin-hero-panel">
            <div className="admin-hero-copy">
              <span className="admin-panel-kicker">TỔNG QUAN THÔNG MINH</span>
              <h2>Theo dõi nhanh tình hình bán hàng và vận hành ngay trên một màn hình</h2>
              <p>
                Dashboard tổng hợp doanh thu, phân bố trạng thái đơn hàng và nhóm sản phẩm để
                bạn nắm được bức tranh hoạt động của cửa hàng một cách trực quan hơn.
              </p>
            </div>
          </section>

          <section className="admin-chart-grid">
            <article className="admin-surface admin-chart-card">
              <div className="admin-section-head">
                <div>
                  <span className="admin-panel-kicker">DOANH THU 7 NGÀY</span>
                  <h3>Biến động doanh thu gần đây</h3>
                </div>
              </div>

              <div className="admin-revenue-chart">
                {revenue7Days.map((item) => (
                  <div key={item.key} className="admin-revenue-bar">
                    <span className="admin-revenue-value">{formatCurrency(item.total)}</span>
                    <div className="admin-revenue-track">
                      <div
                        className="admin-revenue-fill"
                        style={{ height: `${Math.max(8, (item.total / maxRevenue) * 100)}%` }}
                      />
                    </div>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-surface admin-chart-card">
              <div className="admin-section-head">
                <div>
                  <span className="admin-panel-kicker">TRẠNG THÁI ĐƠN HÀNG</span>
                  <h3>Phân bố quy trình xử lý</h3>
                </div>
              </div>

              <div className="admin-bar-list">
                {orderStatusData.map((item) => (
                  <div key={item.label} className="admin-bar-row">
                    <div className="admin-bar-meta">
                      <strong>{item.label}</strong>
                      <span>{item.count} đơn</span>
                    </div>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{ width: `${Math.max(10, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-surface admin-chart-card">
              <div className="admin-section-head">
                <div>
                  <span className="admin-panel-kicker">DANH MỤC SẢN PHẨM</span>
                  <h3>Nhóm sản phẩm nổi bật</h3>
                </div>
              </div>

              <div className="admin-bar-list">
                {categoryData.map((item) => (
                  <div key={item.label} className="admin-bar-row">
                    <div className="admin-bar-meta">
                      <strong>{item.label}</strong>
                      <span>{item.count} sản phẩm</span>
                    </div>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill admin-bar-fill-accent"
                        style={{ width: `${Math.max(10, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-surface">
            <div className="admin-section-head">
              <div>
                <span className="admin-panel-kicker">CHỈ SỐ CẦN CHÚ Ý</span>
                <h3>Điểm cần theo dõi trong ngày</h3>
              </div>
            </div>

            <div className="admin-health-grid">
              <div className="admin-health-card">
                <strong>{lowStockProducts}</strong>
                <span>Sản phẩm sắp hết hàng</span>
              </div>
              <div className="admin-health-card">
                <strong>{users.filter((item) => item.role === "ADMIN").length}</strong>
                <span>Tài khoản quản trị</span>
              </div>
              <div className="admin-health-card">
                <strong>{pendingOrders}</strong>
                <span>Đơn hàng chờ xử lý</span>
              </div>
              <div className="admin-health-card">
                <strong>{completedOrders}</strong>
                <span>Đơn hàng đã hoàn tất</span>
              </div>
            </div>
          </section>

          <section className="admin-surface">
            <div className="admin-section-head">
              <div>
                <span className="admin-panel-kicker">NGƯỜI DÙNG MỚI</span>
                <h3>Tài khoản vừa đăng ký</h3>
              </div>
              <Link to="/admin/users" className="admin-inline-link">
                Xem tất cả
              </Link>
            </div>

            <div className="admin-list">
              {latestUsers.map((user) => (
                <article key={user.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>{user.fullName}</strong>
                    <p>{user.email}</p>
                  </div>
                  <div className="admin-list-side">
                    <span
                      className={`admin-status-pill ${user.role === "ADMIN" ? "is-admin" : ""}`}
                    >
                      {user.role}
                    </span>
                    <small>{formatDate(user.createdAt)}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-surface">
            <div className="admin-section-head">
              <div>
                <span className="admin-panel-kicker">ĐƠN HÀNG GẦN ĐÂY</span>
                <h3>Đơn hàng mới cập nhật</h3>
              </div>
              <Link to="/admin/orders" className="admin-inline-link">
                Xem tất cả
              </Link>
            </div>

            <div className="admin-list">
              {latestOrders.map((order) => (
                <article key={order.id} className="admin-list-item">
                  <div className="admin-list-main">
                    <strong>Đơn hàng #{order.id}</strong>
                    <p>
                      {order.customerName} • {order.customerEmail}
                    </p>
                  </div>
                  <div className="admin-list-side">
                    <span
                      className={`admin-status-pill is-${String(order.status || "").toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                    <small>{formatCurrency(order.totalAmount)}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-surface admin-product-preview">
            <div className="admin-section-head">
              <div>
                <span className="admin-panel-kicker">SẢN PHẨM MỚI NHẤT</span>
                <h3>Sản phẩm vừa cập nhật</h3>
              </div>
              <Link to="/admin/products" className="admin-inline-link">
                Xem tất cả
              </Link>
            </div>

            <div className="admin-mini-grid">
              {latestProducts.map((product) => (
                <article key={product.id} className="admin-product-tile">
                  <div className="admin-product-thumb">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      onError={(event) => handleProductImageError(event, product)}
                    />
                  </div>
                  <strong>{product.name}</strong>
                  <p>{product.category}</p>
                  <span>{formatCurrency(product.price)}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
