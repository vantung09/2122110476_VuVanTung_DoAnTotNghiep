import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { sortNewestFirst } from "../../utils/sortNewestFirst";

const createEmptyForm = () => ({
  fullName: "",
  email: "",
  password: "",
  role: "USER",
});

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(createEmptyForm());
  const [createMsg, setCreateMsg] = useState("");

  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "USER",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [pwModalUser, setPwModalUser] = useState(null);
  const [pwValue, setPwValue] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get("/admin/users");
      setUsers(sortNewestFirst(res.data));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách người dùng.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const kw = searchTerm.trim().toLowerCase();
      const matchKw =
        !kw ||
        u.fullName?.toLowerCase().includes(kw) ||
        u.email?.toLowerCase().includes(kw);

      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchKw && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
  };

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
      await axiosClient.post("/admin/users", createForm);
      setCreateMsg("Tạo người dùng thành công.");
      setCreateForm(createEmptyForm());
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo người dùng thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user) => {
    setEditModalUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "USER",
    });
    setEditError("");
  };

  const closeEditModal = () => {
    setEditModalUser(null);
    setEditForm({
      fullName: "",
      email: "",
      role: "USER",
    });
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();

    if (!editForm.fullName?.trim()) {
      setEditError("Họ tên không được để trống.");
      return;
    }

    if (!editForm.email?.trim()) {
      setEditError("Email không được để trống.");
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      await axiosClient.put(`/admin/users/${editModalUser.id}`, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
      });

      await fetchUsers();
      closeEditModal();
    } catch (err) {
      setEditError(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setEditLoading(false);
    }
  };

  const openPwModal = (user) => {
    setPwModalUser(user);
    setPwValue("");
    setPwError("");
  };

  const closePwModal = () => {
    setPwModalUser(null);
    setPwValue("");
    setPwError("");
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();

    if (!pwValue.trim()) {
      setPwError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (pwValue.length < 6) {
      setPwError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setPwLoading(true);
    setPwError("");

    try {
      await axiosClient.put(`/admin/users/${pwModalUser.id}`, {
        fullName: pwModalUser.fullName || "",
        email: pwModalUser.email || "",
        role: pwModalUser.role || "USER",
        password: pwValue,
      });

      await fetchUsers();
      closePwModal();
    } catch (err) {
      setPwError(err.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      await axiosClient.delete(`/admin/users/${id}`);

      if (editModalUser?.id === id) closeEditModal();
      if (pwModalUser?.id === id) closePwModal();

      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa người dùng thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý người dùng"
      subtitle="Tạo, chỉnh sửa thông tin và đổi mật khẩu người dùng."
    >
      <section className="page-gap">
        {error && <div className="admin-flash error">{error}</div>}

        <div className="card p-lg">
          <h2>Thêm người dùng mới</h2>

          <form className="form-grid" onSubmit={handleCreateSubmit}>
            <input
              className="input"
              name="fullName"
              placeholder="Họ và tên"
              value={createForm.fullName}
              onChange={handleCreateChange}
              required
            />

            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email"
              value={createForm.email}
              onChange={handleCreateChange}
              required
            />

            <input
              className="input"
              name="password"
              type="password"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={createForm.password}
              onChange={handleCreateChange}
              required
            />

            <select
              className="input"
              name="role"
              value={createForm.role}
              onChange={handleCreateChange}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            {createMsg && <div className="success-box grid-span-2">{createMsg}</div>}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo người dùng"}
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setCreateForm(createEmptyForm())}
              >
                Làm mới
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="input admin-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">Tất cả quyền</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
          </div>

          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {users.length}</span>
            <span className="admin-summary-pill">Kết quả: {filteredUsers.length}</span>
            <span className="admin-summary-pill">
              Admin: {users.filter((u) => u.role === "ADMIN").length}
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
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="td-id">{user.id}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : ""}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(user)}
                      >
                        Sửa
                      </button>

                      <button
                        className="btn btn-outline-warning btn-sm"
                        onClick={() => openPwModal(user)}
                      >
                        Đổi mật khẩu
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editModalUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Chỉnh sửa người dùng</h3>

            <p className="modal-subtitle">
              Đang sửa: <strong>{editModalUser.fullName}</strong> ({editModalUser.email})
            </p>

            <form onSubmit={saveEdit}>
              <div className="modal-field">
                <label>Họ và tên</label>
                <input
                  className="input"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  autoFocus
                />
              </div>

              <div className="modal-field">
                <label>Email</label>
                <input
                  className="input"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </div>

              <div className="modal-field">
                <label>Quyền</label>
                <select
                  className="input"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {editError && <div className="error-box">{editError}</div>}

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>

                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwModalUser && (
        <div className="modal-overlay" onClick={closePwModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Đổi mật khẩu</h3>

            <p className="modal-subtitle">
              Người dùng: <strong>{pwModalUser.fullName}</strong> ({pwModalUser.email})
            </p>

            <form onSubmit={handlePwSubmit}>
              <div className="modal-field">
                <label>Mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  value={pwValue}
                  onChange={(e) => setPwValue(e.target.value)}
                  autoFocus
                />
              </div>

              {pwError && <div className="error-box">{pwError}</div>}

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                  {pwLoading ? "Đang lưu..." : "Lưu mật khẩu"}
                </button>

                <button type="button" className="btn btn-secondary" onClick={closePwModal}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}