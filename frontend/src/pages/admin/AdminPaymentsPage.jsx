import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";

const paymentStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
const paymentMethods = ["MOMO", "COD", "BANK_TRANSFER", "CASH", "OTHER"];

const emptyForm = {
  orderId: "",
  amount: "",
  method: "MOMO",
  status: "PENDING",
  transactionRef: "",
  paymentUrl: "",
};

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} d`;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPayments = async () => {
    const res = await axiosClient.get("/admin/payments");
    setPayments(res.data || []);
  };

  const fetchOrders = async () => {
    const res = await axiosClient.get("/admin/orders");
    setOrders(res.data || []);
  };

  const fetchAll = async () => {
    try {
      await Promise.all([fetchPayments(), fetchOrders()]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Khong tai duoc du lieu thanh toan.");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => map.set(Number(order.id), order));
    return map;
  }, [orders]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        String(payment.id || "").includes(keyword) ||
        String(payment.orderId || "").includes(keyword) ||
        String(payment.customerName || "").toLowerCase().includes(keyword) ||
        String(payment.customerEmail || "").toLowerCase().includes(keyword) ||
        String(payment.transactionRef || "").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "ALL" || payment.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        orderId: Number(form.orderId),
        amount: form.amount === "" ? null : Number(form.amount),
        method: form.method,
        status: form.status,
        transactionRef: form.transactionRef,
        paymentUrl: form.paymentUrl,
      };

      if (editingId) {
        await axiosClient.put(`/admin/payments/${editingId}`, payload);
        setMessage("Cap nhat giao dich thanh cong.");
      } else {
        await axiosClient.post("/admin/payments", payload);
        setMessage("Tao giao dich thanh cong.");
      }

      resetForm();
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || "Luu giao dich that bai.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment.id);
    setForm({
      orderId: String(payment.orderId || ""),
      amount: payment.amount ?? "",
      method: payment.method || "MOMO",
      status: payment.status || "PENDING",
      transactionRef: payment.transactionRef || "",
      paymentUrl: payment.paymentUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ban co chac muon xoa giao dich nay khong?")) return;

    try {
      await axiosClient.delete(`/admin/payments/${id}`);
      setMessage("Xoa giao dich thanh cong.");
      setError("");
      if (editingId === id) {
        resetForm();
      }
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || "Xoa giao dich that bai.");
    }
  };

  return (
    <AdminShell
      title="Quan ly thanh toan"
      subtitle="Theo doi va chinh sua giao dich thanh toan theo tung don hang."
    >
      <section className="page-gap">
        <div className="card p-lg">
          <h1>{editingId ? "Cap nhat giao dich" : "Them giao dich"}</h1>

          <form className="form-grid" onSubmit={handleSubmit}>
            <select className="input" name="orderId" value={form.orderId} onChange={handleChange}>
              <option value="">Chon don hang</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id} - {order.customerName} ({formatCurrency(order.totalAmount)})
                </option>
              ))}
            </select>

            <input
              className="input"
              name="amount"
              type="number"
              placeholder="So tien (bo trong de lay tong don)"
              value={form.amount}
              onChange={handleChange}
            />

            <select className="input" name="method" value={form.method} onChange={handleChange}>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>

            <select className="input" name="status" value={form.status} onChange={handleChange}>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              className="input"
              name="transactionRef"
              placeholder="Ma giao dich"
              value={form.transactionRef}
              onChange={handleChange}
            />

            <input
              className="input"
              name="paymentUrl"
              placeholder="Duong dan thanh toan"
              value={form.paymentUrl}
              onChange={handleChange}
            />

            {message ? <div className="success-box grid-span-2">{message}</div> : null}
            {error ? <div className="error-box grid-span-2">{error}</div> : null}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting
                  ? "Dang luu..."
                  : editingId
                    ? "Cap nhat giao dich"
                    : "Them giao dich"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={resetForm}>
                Lam moi bieu mau
              </button>
            </div>
          </form>
        </div>

        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BO LOC THANH TOAN</span>
              <h2>Tim nhanh giao dich theo don hang, khach hang, ma giao dich</h2>
            </div>
          </div>

          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input
              className="input admin-search-input"
              placeholder="Tim theo id, don hang, ten khach, email hoac ma giao dich"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="input admin-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Tat ca trang thai</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tong: {payments.length}</span>
            <span className="admin-summary-pill">Ket qua loc: {filteredPayments.length}</span>
            <span className="admin-summary-pill">
              Completed: {payments.filter((item) => item.status === "COMPLETED").length}
            </span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>
              Xoa bo loc
            </button>
          </div>
        </div>

        <div className="card p-lg overflow-x">
          <h2>Danh sach giao dich</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Don</th>
                <th>Khach</th>
                <th>So tien</th>
                <th>Method</th>
                <th>Status</th>
                <th>Ref</th>
                <th>Tao luc</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const order = orderMap.get(Number(payment.orderId));
                return (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>#{payment.orderId}</td>
                    <td>
                      <div>
                        <strong>{payment.customerName || order?.customerName || "--"}</strong>
                        <p className="muted">{payment.customerEmail || order?.customerEmail || "--"}</p>
                      </div>
                    </td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.status}</td>
                    <td>{payment.transactionRef || "--"}</td>
                    <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString("vi-VN") : "--"}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(payment)}>
                          Sua
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(payment.id)}>
                          Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-empty-cell">
                    Khong co giao dich phu hop voi bo loc hien tai.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
