import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";

const emptyForm = {
  name: "",
  description: "",
  active: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/admin/categories");
      setCategories(res.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh mục.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return categories.filter((item) => {
      const matchesKeyword =
        !keyword ||
        String(item.name || "").toLowerCase().includes(keyword) ||
        String(item.description || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.active) ||
        (statusFilter === "HIDDEN" && !item.active);

      return matchesKeyword && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const activeCount = categories.filter((item) => item.active).length;
  const usedCount = categories.filter((item) => Number(item.productCount || 0) > 0).length;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await axiosClient.put(`/admin/categories/${editingId}`, form);
        setMessage("Cập nhật danh mục thành công.");
      } else {
        await axiosClient.post("/admin/categories", form);
        setMessage("Thêm danh mục thành công.");
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Lưu danh mục thất bại.");
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
      active: !!category.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này không?")) return;

    try {
      await axiosClient.delete(`/admin/categories/${id}`);
      setMessage("Xóa danh mục thành công.");
      setError("");
      if (editingId === id) {
        resetForm();
      }
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa danh mục thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý danh mục"
      subtitle="Tạo, cập nhật và kiểm soát các danh mục sản phẩm để phần storefront và trang quản trị đồng bộ hơn."
    >
      <section className="page-gap">
        <div className="card p-lg">
          <h1>{editingId ? "Cập nhật danh mục" : "Thêm danh mục"}</h1>

          <form className="form-grid" onSubmit={handleSubmit}>
            <input
              className="input"
              name="name"
              placeholder="Tên danh mục"
              value={form.name}
              onChange={handleChange}
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Hiển thị danh mục để tiếp tục sử dụng
            </label>

            <textarea
              className="input grid-span-2 textarea"
              name="description"
              placeholder="Mô tả ngắn cho danh mục"
              value={form.description}
              onChange={handleChange}
            />

            {message ? <div className="success-box grid-span-2">{message}</div> : null}
            {error ? <div className="error-box grid-span-2">{error}</div> : null}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit">
                {editingId ? "Cập nhật danh mục" : "Thêm danh mục"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={resetForm}>
                Làm mới biểu mẫu
              </button>
            </div>
          </form>
        </div>

        <div className="admin-surface">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">TỔNG QUAN DANH MỤC</span>
              <h2>Theo dõi nhanh tình trạng sử dụng</h2>
            </div>
          </div>

          <div className="admin-health-grid">
            <div className="admin-health-card">
              <strong>{categories.length}</strong>
              <span>Tổng số danh mục</span>
            </div>
            <div className="admin-health-card">
              <strong>{activeCount}</strong>
              <span>Danh mục đang bật</span>
            </div>
            <div className="admin-health-card">
              <strong>{usedCount}</strong>
              <span>Danh mục đang có sản phẩm</span>
            </div>
            <div className="admin-health-card">
              <strong>{filteredCategories.length}</strong>
              <span>Kết quả sau lọc</span>
            </div>
          </div>
        </div>

        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC DANH MỤC</span>
              <h2>Tìm nhanh nhóm sản phẩm cần chỉnh sửa</h2>
            </div>
          </div>

          <div className="admin-toolbar-grid admin-toolbar-grid-compact">
            <input
              className="input admin-search-input"
              placeholder="Tìm theo tên hoặc mô tả"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="input admin-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bật</option>
              <option value="HIDDEN">Tạm ẩn</option>
            </select>
          </div>

          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {categories.length}</span>
            <span className="admin-summary-pill">Kết quả lọc: {filteredCategories.length}</span>
            <span className="admin-summary-pill">Đang dùng: {usedCount}</span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="card p-lg overflow-x">
          <h2>Danh sách danh mục</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Sản phẩm liên kết</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.description || "Chưa có mô tả"}</td>
                  <td>{item.active ? "Đang bật" : "Tạm ẩn"}</td>
                  <td>{item.productCount}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleEdit(item)}>
                        Sửa
                      </button>
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDelete(item.id)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    Không có danh mục phù hợp với bộ lọc hiện tại.
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
