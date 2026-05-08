import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { sortNewestFirst } from "../../utils/sortNewestFirst";

const paymentStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
const paymentMethods = ["MOMO", "COD", "BANK_TRANSFER", "CASH", "OTHER"];

const createEmptyForm = () => ({ orderId: "", amount: "", method: "MOMO", status: "PENDING", transactionRef: "", paymentUrl: "" });

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState(createEmptyForm());
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [editModalPayment, setEditModalPayment] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPayments = async () => {
    const res = await axiosClient.get("/admin/payments");
    setPayments(sortNewestFirst(res.data));
  };

  const fetchOrders = async () => {
    const res = await axiosClient.get("/admin/orders");
    setOrders(sortNewestFirst(res.data));
  };

  const fetchAll = async () => {
    try {
      await Promise.all([fetchPayments(), fetchOrders()]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được dữ liệu thanh toán.");
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => map.set(Number(o.id), o));
    return map;
  }, [orders]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const kw = searchTerm.trim().toLowerCase();
      const matchKw = !kw
        || String(p.id || "").includes(kw)
        || String(p.orderId || "").includes(kw)
        || p.customerName?.toLowerCase().includes(kw)
        || p.customerEmail?.toLowerCase().includes(kw)
        || p.transactionRef?.toLowerCase().includes(kw);
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchKw && matchStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const clearFilters = () => { setSearchTerm(""); setStatusFilter("ALL"); };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    setError("");
    try {
      const payload = {
        orderId: Number(createForm.orderId),
        amount: createForm.amount === "" ? null : Number(createForm.amount),
        method: createForm.method,
        status: createForm.status,
        transactionRef: createForm.transactionRef,
        paymentUrl: createForm.paymentUrl,
      };
      await axiosClient.post("/admin/payments", payload);
      setCreateMsg("Tạo giao dịch thành công.");
      setCreateForm(createEmptyForm());
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo giao dịch thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (payment) => {
    setEditModalPayment(payment);
    setEditForm({
      orderId: String(payment.orderId || ""),
      amount: payment.amount ?? "",
      method: payment.method || "MOMO",
      status: payment.status || "PENDING",
      transactionRef: payment.transactionRef || "",
      paymentUrl: payment.paymentUrl || "",
    });
    setEditError("");
  };

  const closeEditModal = () => { setEditModalPayment(null); setEditForm(createEmptyForm()); setEditError(""); };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const payload = {
        orderId: Number(editForm.orderId),
        amount: editForm.amount === "" ? null : Number(editForm.amount),
        method: editForm.method,
        status: editForm.status,
        transactionRef: editForm.transactionRef,
        paymentUrl: editForm.paymentUrl,
      };
      await axiosClient.put(`/admin/payments/${editModalPayment.id}`, payload);
      await fetchPayments();
      closeEditModal();
    } catch (err) {
      setEditError(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    try {
      await axiosClient.delete(`/admin/payments/${id}`);
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa giao dịch thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý thanh toán"
      subtitle="Theo dõi và chỉnh sửa giao dịch thanh toán."
    >
      <section className="page-gap">

        {error && <div className="admin-flash error">{error}</div>}

        {/* Form tạo giao dịch */}
        <div className="card p-lg">
          <h2>Thêm giao dịch thanh toán</h2>
          <form className="form-grid" onSubmit={handleCreateSubmit}>
            <select className="input" name="orderId" value={createForm.orderId} onChange={handleCreateChange}>
              <option value="">Chọn đơn hàng</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>#{o.id} - {o.customerName} ({formatCurrency(o.totalAmount)})</option>
              ))}
            </select>
            <input className="input" name="amount" type="number" placeholder="Số tiền (bỏ trống để lấy tổng đơn)" value={createForm.amount} onChange={handleCreateChange} />
            <select className="input" name="method" value={createForm.method} onChange={handleCreateChange}>
              {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="input" name="status" value={createForm.status} onChange={handleCreateChange}>
              {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="input" name="transactionRef" placeholder="Mã giao dịch" value={createForm.transactionRef} onChange={handleCreateChange} />
            <input className="input" name="paymentUrl" placeholder="Đường dẫn thanh toán" value={createForm.paymentUrl} onChange={handleCreateChange} />
            {createMsg && <div className="success-box grid-span-2">{createMsg}</div>}
            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Thêm giao dịch"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setCreateForm(createEmptyForm())}>Làm mới</button>
            </div>
          </form>
        </div>

        {/* Bộ lọc */}
        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC</span>
              <h2>Tìm nhanh giao dịch</h2>
            </div>
          </div>
          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input className="input admin-search-input" placeholder="Tìm theo ID, đơn hàng, khách, mã giao dịch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="input admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {payments.length}</span>
            <span className="admin-summary-pill">Kết quả: {filteredPayments.length}</span>
            <span className="admin-summary-pill">Hoàn tất: {payments.filter((p) => p.status === "COMPLETED").length}</span>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        </div>

        {/* Bảng thanh toán */}
        <div className="card p-lg overflow-x">
          <h2>Danh sách giao dịch</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Đơn</th>
                <th>Khách</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Mã GD</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const order = orderMap.get(Number(payment.orderId));
                return (
                  <tr key={payment.id}>
                    <td className="td-id">{payment.id}</td>
                    <td>#{payment.orderId}</td>
                    <td>
                      <strong>{payment.customerName || order?.customerName || "--"}</strong>
                      <p className="muted" style={{ fontSize: "0.75rem" }}>{payment.customerEmail || order?.customerEmail || ""}</p>
                    </td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>
                      <span className={`role-badge role-${payment.status === "COMPLETED" ? "admin" : "user"}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.transactionRef || "--"}</td>
                    <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString("vi-VN") : "--"}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(payment)}>Sửa</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(payment.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr><td colSpan="9" className="table-empty-cell">Không có giao dịch phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Sửa giao dịch */}
      {editModalPayment && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Chỉnh sửa giao dịch</h3>
            <p className="modal-subtitle">
              #{editModalPayment.id} - {editModalPayment.transactionRef || "Không có mã"}
            </p>
            <form onSubmit={saveEdit}>
              <div className="modal-form-grid">
                <div className="modal-field">
                  <label>Đơn hàng</label>
                  <select className="input" name="orderId" value={editForm.orderId} onChange={handleEditChange}>
                    <option value="">Chọn đơn hàng</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>#{o.id} - {o.customerName}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Số tiền</label>
                  <input className="input" name="amount" type="number" value={editForm.amount} onChange={handleEditChange} />
                </div>
                <div className="modal-field">
                  <label>Phương thức</label>
                  <select className="input" name="method" value={editForm.method} onChange={handleEditChange}>
                    {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Trạng thái</label>
                  <select className="input" name="status" value={editForm.status} onChange={handleEditChange}>
                    {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Mã giao dịch</label>
                  <input className="input" name="transactionRef" value={editForm.transactionRef} onChange={handleEditChange} />
                </div>
                <div className="modal-field">
                  <label>Đường dẫn thanh toán</label>
                  <input className="input" name="paymentUrl" value={editForm.paymentUrl} onChange={handleEditChange} />
                </div>
              </div>
              {editError && <div className="error-box">{editError}</div>}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
