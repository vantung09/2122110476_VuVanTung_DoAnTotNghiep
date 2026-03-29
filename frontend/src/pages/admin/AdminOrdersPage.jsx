import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminMenu from "../../components/AdminMenu";

const statuses = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await axiosClient.get("/admin/orders");
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được đơn hàng");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await axiosClient.put(`/admin/orders/${id}/status`, { status });
      setMessage("Cập nhật trạng thái đơn hàng thành công");
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  return (
    <div className="admin-layout">
      <AdminMenu />
      <section className="admin-content page-gap">
        <div className="card p-lg">
          <h1>Quản lý đơn hàng</h1>
          {message ? <div className="success-box">{message}</div> : null}
          {error ? <div className="error-box">{error}</div> : null}
        </div>

        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="card p-lg order-card">
              <div className="order-top">
                <div>
                  <h3>Đơn hàng #{order.id}</h3>
                  <p>Khách: {order.customerName} - {order.customerEmail}</p>
                  <p>Tạo lúc: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</p>
                </div>
                <div className="order-right">
                  <strong>{Number(order.totalAmount || 0).toLocaleString()} đ</strong>
                  <select
                    className="input"
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="order-items">
                {order.items?.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <img src={item.imageUrl || "https://via.placeholder.com/60"} alt={item.productName} />
                    <div>
                      <p><strong>{item.productName}</strong></p>
                      <p>Số lượng: {item.quantity}</p>
                      <p>Giá: {Number(item.price || 0).toLocaleString()} đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
