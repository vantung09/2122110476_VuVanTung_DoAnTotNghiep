import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";

const emptyForm = {
  name: "",
  brand: "Apple",
  price: 0,
  originalPrice: 0,
  stock: 0,
  imageUrl: "",
  description: "",
  category: "iPhone",
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get("/admin/products");
      setProducts([...(res.data || [])].sort((left, right) => Number(right.id || 0) - Number(left.id || 0)));
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được sản phẩm.");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories
        .map((item) => String(item.name || "").trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "vi")),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        String(item.name || "").toLowerCase().includes(keyword) ||
        String(item.brand || "").toLowerCase().includes(keyword) ||
        String(item.category || "").toLowerCase().includes(keyword);

      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === "ALL" ||
        (visibilityFilter === "VISIBLE" && item.active) ||
        (visibilityFilter === "HIDDEN" && !item.active);

      const stock = Number(item.stock || 0);
      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW" && stock > 0 && stock <= 5) ||
        (stockFilter === "OUT" && stock === 0) ||
        (stockFilter === "AVAILABLE" && stock > 5);

      return matchesKeyword && matchesCategory && matchesVisibility && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, visibilityFilter, stockFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setVisibilityFilter("ALL");
    setStockFilter("ALL");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosClient.post("/admin/uploads/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((prev) => ({
        ...prev,
        imageUrl: res.data.url,
      }));
      setMessage("Tải ảnh lên thành công.");
    } catch (err) {
      setError(err.response?.data?.message || "Tải ảnh lên thất bại.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        stock: Number(form.stock),
      };

      if (editingId) {
        await axiosClient.put(`/admin/products/${editingId}`, payload);
        setMessage("Cập nhật sản phẩm thành công.");
      } else {
        await axiosClient.post("/admin/products", payload);
        setMessage("Thêm sản phẩm thành công.");
      }

      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Lưu sản phẩm thất bại.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      brand: item.brand || "",
      price: item.price || 0,
      originalPrice: item.originalPrice || 0,
      stock: item.stock || 0,
      imageUrl: item.imageUrl || "",
      description: item.description || "",
      category: item.category || "",
      active: !!item.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;

    try {
      await axiosClient.delete(`/admin/products/${id}`);
      setMessage("Xóa sản phẩm thành công.");
      setError("");
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa sản phẩm thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý sản phẩm"
      subtitle="Thêm ảnh, cập nhật thông tin, theo dõi tồn kho và lọc nhanh sản phẩm trong khu vực quản trị."
    >
      <section className="page-gap">
        <div className="card p-lg">
          <h1>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h1>

          <form className="form-grid" onSubmit={handleSubmit}>
            <input
              className="input"
              name="name"
              placeholder="Tên sản phẩm"
              value={form.name}
              onChange={handleChange}
            />
            <input
              className="input"
              name="brand"
              placeholder="Thương hiệu"
              value={form.brand}
              onChange={handleChange}
            />
            <input
              className="input"
              name="price"
              type="number"
              placeholder="Giá bán"
              value={form.price}
              onChange={handleChange}
            />
            <input
              className="input"
              name="originalPrice"
              type="number"
              placeholder="Giá gốc"
              value={form.originalPrice}
              onChange={handleChange}
            />
            <input
              className="input"
              name="stock"
              type="number"
              placeholder="Tồn kho"
              value={form.stock}
              onChange={handleChange}
            />
            <input
              className="input"
              name="category"
              list="admin-category-options"
              placeholder="Danh mục"
              value={form.category}
              onChange={handleChange}
            />
            <datalist id="admin-category-options">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>

            <div className="grid-span-2 admin-image-upload">
              <div className="admin-image-preview">
                {form.imageUrl ? (
                  <img
                    src={getProductImageUrl({ ...form, name: form.name || "Ảnh sản phẩm" })}
                    alt={form.name || "Ảnh sản phẩm"}
                    onError={(event) => handleProductImageError(event, form)}
                  />
                ) : (
                  <span>Chưa có ảnh sản phẩm</span>
                )}
              </div>

              <div className="admin-image-upload-panel">
                <label className="admin-file-trigger" htmlFor="product-image-upload">
                  {uploadingImage ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}
                </label>
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="admin-file-input"
                />
                <input
                  className="input"
                  name="imageUrl"
                  placeholder="Hoặc dán URL hình ảnh"
                  value={form.imageUrl}
                  onChange={handleChange}
                />
                <p className="muted">
                  Bạn có thể tải ảnh trực tiếp hoặc dùng đường dẫn ảnh có sẵn.
                </p>
              </div>
            </div>

            <textarea
              className="input grid-span-2 textarea"
              name="description"
              placeholder="Mô tả sản phẩm"
              value={form.description}
              onChange={handleChange}
            />

            <label className="checkbox-row grid-span-2">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Hiển thị sản phẩm trên website
            </label>

            {message ? <div className="success-box grid-span-2">{message}</div> : null}
            {error ? <div className="error-box grid-span-2">{error}</div> : null}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={uploadingImage}>
                {editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
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
              <span className="admin-panel-kicker">BỘ LỌC SẢN PHẨM</span>
              <h2>Tra cứu nhanh danh sách sản phẩm</h2>
            </div>
          </div>

          <div className="admin-toolbar-grid">
            <input
              className="input admin-search-input"
              placeholder="Tìm theo tên, thương hiệu hoặc danh mục"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="input admin-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="ALL">Tất cả danh mục</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              className="input admin-select"
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="VISIBLE">Đang hiển thị</option>
              <option value="HIDDEN">Đang ẩn</option>
            </select>
            <select
              className="input admin-select"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="ALL">Mọi mức tồn kho</option>
              <option value="LOW">Sắp hết hàng</option>
              <option value="OUT">Hết hàng</option>
              <option value="AVAILABLE">Còn hàng tốt</option>
            </select>
          </div>

          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {products.length}</span>
            <span className="admin-summary-pill">Kết quả lọc: {filteredProducts.length}</span>
            <span className="admin-summary-pill">
              Hiển thị: {products.filter((item) => item.active).length}
            </span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="card p-lg overflow-x">
          <h2>Danh sách sản phẩm</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Hiển thị</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <div className="admin-table-image">
                      {item.imageUrl ? (
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          onError={(event) => handleProductImageError(event, item)}
                        />
                      ) : (
                        <span>Không có</span>
                      )}
                    </div>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{Number(item.price || 0).toLocaleString("vi-VN")} đ</td>
                  <td>{item.stock}</td>
                  <td>{item.active ? "Có" : "Không"}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>
                        Sửa
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-cell">
                    Không có sản phẩm phù hợp với bộ lọc hiện tại.
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
