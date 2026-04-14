import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";

const statuses = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];

const emptyCreateForm = {
  userId: "",
  status: "PENDING",
  items: [{ productId: "", quantity: 1 }],
};

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = async () => {
    const res = await axiosClient.get("/admin/orders");
    setOrders(res.data || []);
  };

  const fetchMasterData = async () => {
    const [usersRes, productsRes] = await Promise.all([
      axiosClient.get("/admin/users"),
      axiosClient.get("/admin/products"),
    ]);
    setUsers(usersRes.data || []);
    setProducts(productsRes.data || []);
  };

  const fetchAll = async () => {
    try {
      await Promise.all([fetchOrders(), fetchMasterData()]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được dữ liệu đơn hàng.");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(Number(product.id), product));
    return map;
  }, [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        String(order.id || "").includes(keyword) ||
        String(order.customerName || "").toLowerCase().includes(keyword) ||
        String(order.customerEmail || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
  };

  const handleCreateBaseChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItemRow = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1 }],
    }));
  };

  const removeItemRow = (index) => {
    setCreateForm((prev) => {
      if (prev.items.length === 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        userId: Number(createForm.userId),
        status: createForm.status,
        items: createForm.items
          .filter((item) => item.productId && Number(item.quantity) > 0)
          .map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
          })),
      };

      await axiosClient.post("/admin/orders", payload);
      setMessage("Tạo đơn hàng thành công.");
      resetCreateForm();
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo đơn hàng thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axiosClient.put(`/admin/orders/${id}/status`, { status });
      setMessage("Cập nhật trạng thái đơn hàng thành công.");
      setError("");
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật trạng thái thất bại.");
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này không?")) return;

    try {
      await axiosClient.delete(`/admin/orders/${id}`);
      setMessage("Xóa đơn hàng thành công.");
      setError("");
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa đơn hàng thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý đơn hàng"
      subtitle="Tạo nhanh đơn hàng, cập nhật trạng thái và theo dõi chi tiết sản phẩm."
    >
      <section className="page-gap">
        <div className="card p-lg">
          <h1>Tạo đơn hàng mới</h1>

          <form className="form-grid" onSubmit={handleCreateOrder}>
            <select
              className="input"
              name="userId"
              value={createForm.userId}
              onChange={handleCreateBaseChange}
            >
              <option value="">Chọn người dùng</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  #{user.id} - {user.fullName} ({user.email})
                </option>
              ))}
            </select>

            <select
              className="input"
              name="status"
              value={createForm.status}
              onChange={handleCreateBaseChange}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="grid-span-2">
              {createForm.items.map((item, index) => {
                const product = productMap.get(Number(item.productId));
                return (
                  <div key={`item-${index}`} className="admin-toolbar-grid admin-toolbar-grid-compact">
                    <select
                      className="input"
                      value={item.productId}
                      onChange={(event) => handleItemChange(index, "productId", event.target.value)}
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map((productOption) => (
                        <option key={productOption.id} value={productOption.id}>
                          #{productOption.id} - {productOption.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, "quantity", event.target.value)}
                      placeholder="Số lượng"
                    />
                    <input className="input" value={product ? formatCurrency(product.price) : "--"} disabled />
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={createForm.items.length === 1}
                    >
                      Xóa dòng
                    </button>
                  </div>
                );
              })}
            </div>

            {message ? <div className="success-box grid-span-2">{message}</div> : null}
            {error ? <div className="error-box grid-span-2">{error}</div> : null}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo đơn hàng"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={addItemRow}>
                Thêm sản phẩm
              </button>
              <button className="btn btn-secondary" type="button" onClick={resetCreateForm}>
                Làm mới biểu mẫu
              </button>
            </div>
          </form>
        </div>

        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC ĐƠN HÀNG</span>
              <h2>Tìm nhanh đơn hàng theo khách hoặc trạng thái</h2>
            </div>
          </div>

          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input
              className="input admin-search-input"
              placeholder="Tìm theo mã đơn, tên khách hoặc email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="input admin-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {orders.length}</span>
            <span className="admin-summary-pill">Kết quả lọc: {filteredOrders.length}</span>
            <span className="admin-summary-pill">
              Hoàn tất: {orders.filter((item) => item.status === "COMPLETED").length}
            </span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="order-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-lg order-card">
              <div className="order-top">
                <div>
                  <h3>Đơn hàng #{order.id}</h3>
                  <p>
                    Khách: {order.customerName} - {order.customerEmail}
                  </p>
                  <p>
                    Tạo lúc: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}
                  </p>
                </div>
                <div className="order-right">
                  <strong>{formatCurrency(order.totalAmount)}</strong>
                  <select
                    className="input"
                    value={order.status}
                    onChange={(event) => handleUpdateStatus(order.id, event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-danger btn-sm"
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    Xóa đơn
                  </button>
                </div>
              </div>

              <div className="order-items">
                {order.items?.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="order-item-row">
                    <img
                                    src={getProductImageUrl({ imageUrl: item.imageUrl, name: item.productName })}
                      alt={item.productName}
                      onError={(event) => handleProductImageError(event, { name: item.productName })}
                    />
                    <div>
                      <p>
                        <strong>{item.productName}</strong>
                      </p>
                      <p>Số lượng: {item.quantity}</p>
                      <p>Giá: {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 ? (
            <div className="admin-empty-state">Không có đơn hàng phù hợp với bộ lọc hiện tại.</div>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
