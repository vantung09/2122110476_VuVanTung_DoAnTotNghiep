import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";
import { sortNewestFirst } from "../../utils/sortNewestFirst";

const statuses = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];
const emptyCreateForm = { userId: "", status: "PENDING", items: [{ productId: "", quantity: 1 }] };

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [detailModalOrder, setDetailModalOrder] = useState(null);
  const [detailStatus, setDetailStatus] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = async () => {
    const res = await axiosClient.get("/admin/orders");
    setOrders(sortNewestFirst(res.data));
  };

  const fetchMasterData = async () => {
    const [usersRes, productsRes] = await Promise.all([
      axiosClient.get("/admin/users"),
      axiosClient.get("/admin/products"),
    ]);
    setUsers(sortNewestFirst(usersRes.data));
    setProducts(sortNewestFirst(productsRes.data));
  };

  const fetchAll = async () => {
    try {
      await Promise.all([fetchOrders(), fetchMasterData()]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được dữ liệu đơn hàng.");
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(Number(p.id), p));
    return map;
  }, [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const kw = searchTerm.trim().toLowerCase();
      const matchKw = !kw
        || String(order.id || "").includes(kw)
        || order.customerName?.toLowerCase().includes(kw)
        || order.customerEmail?.toLowerCase().includes(kw);
      const matchStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchKw && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const clearFilters = () => { setSearchTerm(""); setStatusFilter("ALL"); };

  const handleCreateBaseChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setCreateForm((p) => ({
      ...p,
      items: p.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addItemRow = () => setCreateForm((p) => ({ ...p, items: [...p.items, { productId: "", quantity: 1 }] }));
  const removeItemRow = (index) => {
    if (createForm.items.length === 1) return;
    setCreateForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    setError("");
    try {
      const payload = {
        userId: Number(createForm.userId),
        status: createForm.status,
        items: createForm.items.filter((item) => item.productId && Number(item.quantity) > 0)
          .map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) })),
      };
      await axiosClient.post("/admin/orders", payload);
      setCreateMsg("Tạo đơn hàng thành công.");
      setCreateForm(emptyCreateForm);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo đơn hàng thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const openDetailModal = (order) => {
    setDetailModalOrder(order);
    setDetailStatus(order.status || "PENDING");
    setDetailError("");
  };

  const closeDetailModal = () => { setDetailModalOrder(null); setDetailStatus(""); setDetailError(""); };

  const saveDetailStatus = async (e) => {
    e.preventDefault();
    setDetailLoading(true);
    setDetailError("");
    try {
      await axiosClient.put(`/admin/orders/${detailModalOrder.id}/status`, { status: detailStatus });
      await fetchOrders();
      closeDetailModal();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await axiosClient.delete(`/admin/orders/${id}`);
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

        {error && <div className="admin-flash error">{error}</div>}

        {/* Form tạo đơn hàng */}
        <div className="card p-lg">
          <h2>Tạo đơn hàng mới</h2>
          <form className="form-grid" onSubmit={handleCreateOrder}>
            <select className="input" name="userId" value={createForm.userId} onChange={handleCreateBaseChange}>
              <option value="">Chọn người dùng</option>
              {users.map((u) => <option key={u.id} value={u.id}>#{u.id} - {u.fullName} ({u.email})</option>)}
            </select>
            <select className="input" name="status" value={createForm.status} onChange={handleCreateBaseChange}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="grid-span-2">
              {createForm.items.map((item, index) => {
                const product = productMap.get(Number(item.productId));
                return (
                  <div key={`item-${index}`} className="admin-toolbar-grid admin-toolbar-grid-compact" style={{ marginBottom: 8 }}>
                    <select className="input" value={item.productId} onChange={(e) => handleItemChange(index, "productId", e.target.value)}>
                      <option value="">Chọn sản phẩm</option>
                      {products.map((p) => <option key={p.id} value={p.id}>#{p.id} - {p.name}</option>)}
                    </select>
                    <input className="input" type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} placeholder="Số lượng" />
                    <input className="input" value={product ? formatCurrency(product.price) : "--"} disabled />
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => removeItemRow(index)} disabled={createForm.items.length === 1}>Xóa</button>
                  </div>
                );
              })}
            </div>

            {createMsg && <div className="success-box grid-span-2">{createMsg}</div>}
            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Tạo đơn hàng"}</button>
              <button className="btn btn-secondary" type="button" onClick={addItemRow}>Thêm sản phẩm</button>
              <button className="btn btn-secondary" type="button" onClick={() => setCreateForm(emptyCreateForm)}>Làm mới</button>
            </div>
          </form>
        </div>

        {/* Bộ lọc */}
        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC ĐƠN HÀNG</span>
              <h2>Tìm nhanh đơn hàng theo khách hoặc trạng thái</h2>
            </div>
          </div>
          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input className="input admin-search-input" placeholder="Tìm theo mã đơn, tên khách hoặc email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="input admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {orders.length}</span>
            <span className="admin-summary-pill">Kết quả: {filteredOrders.length}</span>
            <span className="admin-summary-pill">Hoàn tất: {orders.filter((o) => o.status === "COMPLETED").length}</span>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="order-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-lg order-card">
              <div className="order-top">
                <div>
                  <h3>Đơn hàng #{order.id}</h3>
                  <p>Khách: {order.customerName} - {order.customerEmail}</p>
                  <p>Tạo lúc: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}</p>
                </div>
                <div className="order-right">
                  <strong>{formatCurrency(order.totalAmount)}</strong>
                  <button className="btn btn-secondary btn-sm" onClick={() => openDetailModal(order)}>Xem chi tiết</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOrder(order.id)}>Xóa</button>
                </div>
              </div>

              <div className="order-items">
                {order.items?.map((item, idx) => (
                  <div key={`${order.id}-${idx}`} className="order-item-row">
                    <img
                      src={getProductImageUrl({ imageUrl: item.imageUrl, name: item.productName })}
                      alt={item.productName}
                      onError={(e) => handleProductImageError(e, { name: item.productName })}
                    />
                    <div>
                      <p><strong>{item.productName}</strong></p>
                      <p>Số lượng: {item.quantity} | Giá: {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="admin-empty-state">Không có đơn hàng phù hợp.</div>
          )}
        </div>
      </section>

      {/* Modal chi tiết đơn hàng */}
      {detailModalOrder && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Chi tiết đơn hàng #{detailModalOrder.id}</h3>
            <p className="modal-subtitle">
              Khách: <strong>{detailModalOrder.customerName}</strong> ({detailModalOrder.customerEmail})
            </p>
            <form onSubmit={saveDetailStatus}>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <label>Tổng tiền</label>
                  <span className="modal-info-value">{formatCurrency(detailModalOrder.totalAmount)}</span>
                </div>
                <div className="modal-info-item">
                  <label>Ngày tạo</label>
                  <span className="modal-info-value">
                    {detailModalOrder.createdAt ? new Date(detailModalOrder.createdAt).toLocaleString("vi-VN") : "--"}
                  </span>
                </div>
              </div>

              <div className="modal-field">
                <label>Cập nhật trạng thái</label>
                <select className="input" value={detailStatus} onChange={(e) => setDetailStatus(e.target.value)}>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="modal-field">
                <label>Sản phẩm trong đơn ({detailModalOrder.items?.length || 0})</label>
                <div className="modal-order-items">
                  {detailModalOrder.items?.map((item, idx) => (
                    <div key={idx} className="modal-order-item">
                      <span>{item.productName}</span>
                      <span>x{item.quantity}</span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {detailError && <div className="error-box">{detailError}</div>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={detailLoading}>
                  {detailLoading ? "Đang lưu..." : "Lưu trạng thái"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeDetailModal}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
