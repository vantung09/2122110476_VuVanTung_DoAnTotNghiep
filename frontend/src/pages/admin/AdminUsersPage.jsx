import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminMenu from "../../components/AdminMenu";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách người dùng");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await axiosClient.delete(`/admin/users/${id}`);
      setMessage("Xóa người dùng thành công");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa người dùng thất bại");
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await axiosClient.put(`/admin/users/${id}/role`, { role });
      setMessage("Cập nhật quyền thành công");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Đổi quyền thất bại");
    }
  };

  return (
    <div className="admin-layout">
      <AdminMenu />
      <section className="admin-content page-gap">
        <div className="card p-lg">
          <h1>Quản lý người dùng</h1>
          {message ? <div className="success-box">{message}</div> : null}
          {error ? <div className="error-box">{error}</div> : null}
        </div>

        <div className="card p-lg overflow-x">
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
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="input select-mini"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : ""}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
