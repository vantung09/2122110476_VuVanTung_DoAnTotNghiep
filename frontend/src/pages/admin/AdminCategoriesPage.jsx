import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { sortNewestFirst } from "../../utils/sortNewestFirst";

const createEmptyForm = () => ({ name: "", description: "", active: true });

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState(createEmptyForm());
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [editModalCategory, setEditModalCategory] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/admin/categories");
      setCategories(sortNewestFirst(res.data));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh mục.");
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((item) => {
      const kw = searchTerm.trim().toLowerCase();
      const matchKw = !kw
        || item.name?.toLowerCase().includes(kw)
        || item.description?.toLowerCase().includes(kw);
      const matchStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" && item.active)
        || (statusFilter === "HIDDEN" && !item.active);
      return matchKw && matchStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const activeCount = categories.filter((c) => c.active).length;
  const usedCount = categories.filter((c) => Number(c.productCount || 0) > 0).length;

  const clearFilters = () => { setSearchTerm(""); setStatusFilter("ALL"); };

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    setError("");
    try {
      await axiosClient.post("/admin/categories", createForm);
      setCreateMsg("Thêm danh mục thành công.");
      setCreateForm(createEmptyForm());
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Thêm danh mục thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (cat) => {
    setEditModalCategory(cat);
    setEditForm({ name: cat.name || "", description: cat.description || "", active: !!cat.active });
    setEditError("");
  };

  const closeEditModal = () => { setEditModalCategory(null); setEditForm(createEmptyForm()); setEditError(""); };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      await axiosClient.put(`/admin/categories/${editModalCategory.id}`, editForm);
      await fetchCategories();
      closeEditModal();
    } catch (err) {
      setEditError(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await axiosClient.delete(`/admin/categories/${id}`);
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa danh mục thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý danh mục"
      subtitle="Tạo và quản lý các danh mục sản phẩm."
    >
      <section className="page-gap">

        {error && <div className="admin-flash error">{error}</div>}

        {/* Form tạo danh mục */}
        <div className="card p-lg">
          <h2>Thêm danh mục mới</h2>
          <form className="form-grid" onSubmit={handleCreateSubmit}>
            <input className="input" name="name" placeholder="Tên danh mục" value={createForm.name} onChange={handleCreateChange} required />
            <label className="checkbox-row">
              <input type="checkbox" name="active" checked={createForm.active} onChange={handleCreateChange} />
              Hiển thị danh mục trên website
            </label>
            <textarea className="input grid-span-2 textarea" name="description" placeholder="Mô tả danh mục" value={createForm.description} onChange={handleCreateChange} />
            {createMsg && <div className="success-box grid-span-2">{createMsg}</div>}
            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Thêm danh mục"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setCreateForm(createEmptyForm())}>Làm mới</button>
            </div>
          </form>
        </div>

        {/* Tổng quan */}
        <div className="admin-surface">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">TỔNG QUAN</span>
              <h2>Thống kê danh mục</h2>
            </div>
          </div>
          <div className="admin-health-grid">
            <div className="admin-health-card"><strong>{categories.length}</strong><span>Tổng danh mục</span></div>
            <div className="admin-health-card"><strong>{activeCount}</strong><span>Đang bật</span></div>
            <div className="admin-health-card"><strong>{usedCount}</strong><span>Có sản phẩm</span></div>
            <div className="admin-health-card"><strong>{filteredCategories.length}</strong><span>Kết quả lọc</span></div>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC</span>
              <h2>Tìm kiếm danh mục</h2>
            </div>
          </div>
          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input className="input admin-search-input" placeholder="Tìm theo tên hoặc mô tả" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="input admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bật</option>
              <option value="HIDDEN">Tạm ẩn</option>
            </select>
          </div>
          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {categories.length}</span>
            <span className="admin-summary-pill">Kết quả: {filteredCategories.length}</span>
            <span className="admin-summary-pill">Đang dùng: {usedCount}</span>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        </div>

        {/* Bảng danh mục */}
        <div className="card p-lg overflow-x">
          <h2>Danh sách danh mục</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Sản phẩm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((item) => (
                <tr key={item.id}>
                  <td className="td-id">{item.id}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.description || "Chưa có mô tả"}</td>
                  <td>
                    <span className={`role-badge role-${item.active ? "admin" : "user"}`}>
                      {item.active ? "Bật" : "Tắt"}
                    </span>
                  </td>
                  <td>{item.productCount}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>Sửa</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr><td colSpan="6" className="table-empty-cell">Không có danh mục phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Sửa danh mục */}
      {editModalCategory && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Chỉnh sửa danh mục</h3>
            <p className="modal-subtitle">#{editModalCategory.id} - {editModalCategory.name}</p>
            <form onSubmit={saveEdit}>
              <div className="modal-field">
                <label>Tên danh mục</label>
                <input className="input" name="name" value={editForm.name} onChange={handleEditChange} required autoFocus />
              </div>
              <div className="modal-field">
                <label>Mô tả</label>
                <textarea className="input textarea" name="description" value={editForm.description} onChange={handleEditChange} rows={3} />
              </div>
              <label className="checkbox-row">
                <input type="checkbox" name="active" checked={editForm.active} onChange={handleEditChange} />
                Hiển thị danh mục trên website
              </label>
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
