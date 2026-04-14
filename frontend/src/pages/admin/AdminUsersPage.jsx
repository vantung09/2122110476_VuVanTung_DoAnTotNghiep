import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  role: "USER",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get("/admin/users");
      setUsers(res.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách người dùng.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        String(user.fullName || "").toLowerCase().includes(keyword) ||
        String(user.email || "").toLowerCase().includes(keyword);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesKeyword && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await axiosClient.put(`/admin/users/${editingId}`, form);
        setMessage("Cập nhật người dùng thành công.");
      } else {
        await axiosClient.post("/admin/users", form);
        setMessage("Tạo người dùng thành công.");
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Lưu người dùng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      role: user.role || "USER",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này không?")) return;

    try {
      await axiosClient.delete(`/admin/users/${id}`);
      setMessage("Xóa người dùng thành công.");
      setError("");
      if (editingId === id) {
        resetForm();
      }
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa người dùng thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý người dùng"
      subtitle="Tạo mới, chỉnh sửa và quản lý quyền tài khoản trong hệ thống."
    >
      <section className="page-gap">
        <div className="card p-lg">
          <h1>{editingId ? "Cập nhật người dùng" : "Thêm người dùng"}</h1>

          <form className="form-grid" onSubmit={handleSubmit}>
            <input
              className="input"
              name="fullName"
              placeholder="Họ và tên"
              value={form.fullName}
              onChange={handleChange}
            />
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              className="input"
              name="password"
              type="password"
              placeholder={editingId ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu"}
              value={form.password}
              onChange={handleChange}
            />
            <select className="input" name="role" value={form.role} onChange={handleChange}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            {message ? <div className="success-box grid-span-2">{message}</div> : null}
            {error ? <div className="error-box grid-span-2">{error}</div> : null}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting
                  ? "Đang lưu..."
                  : editingId
                    ? "Cập nhật người dùng"
                    : "Tạo người dùng"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={resetForm}>
                Làm mới biểu mẫu
              </button>
            </div>
          </form>
        </div>

        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC NGƯỜI DÙNG</span>
              <h2>Tìm kiếm và phân loại tài khoản</h2>
            </div>
          </div>

          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input
              className="input admin-search-input"
              placeholder="Tìm theo họ tên hoặc email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="input admin-select"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="ALL">Tất cả quyền</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
          </div>

          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {users.length}</span>
            <span className="admin-summary-pill">Kết quả lọc: {filteredUsers.length}</span>
            <span className="admin-summary-pill">
              Admin: {users.filter((item) => item.role === "ADMIN").length}
            </span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="card p-lg overflow-x">
          <h2>Danh sách người dùng</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Quyền</th>
                <th>Tạo lúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : ""}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(user)}>
                        Sửa
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    Không có người dùng phù hợp với bộ lọc hiện tại.
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
