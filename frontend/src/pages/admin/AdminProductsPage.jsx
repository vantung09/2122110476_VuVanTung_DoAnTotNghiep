import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminShell from "../../components/AdminShell";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";
import { sortNewestFirst } from "../../utils/sortNewestFirst";

const createEmptyForm = () => ({
  name: "",
  brand: "Apple",
  price: 0,
  originalPrice: 0,
  stock: 0,
  flashSale: false,
  flashSaleStartAt: "",
  flashSaleEndAt: "",
  flashSaleQuantity: 0,
  flashSaleSold: 0,
  imageUrl: "",
  description: "",
  category: "",
  active: true,
});

function formatProductCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function normalizeDateTimeLocal(value) {
  return value ? value : null;
}

function getFlashSaleText(product) {
  if (product.flashSaleActive) return "Đang chạy";
  if (product.flashSaleUpcoming) return "Sắp chạy";
  if (product.flashSaleExpired) return "Đã hết hạn";
  return product.flashSale ? "Đã bật" : "Không";
}

function getProductErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;

  const fieldLabels = {
    name: "Tên sản phẩm",
    price: "Giá bán",
    originalPrice: "Giá gốc",
    stock: "Tồn kho",
    categoryName: "Danh mục",
  };
  const firstField = Object.keys(data)[0];
  if (firstField) {
    return `${fieldLabels[firstField] || firstField}: ${data[firstField]}`;
  }
  return fallback;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(createEmptyForm());
  const [createMsg, setCreateMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editModalProduct, setEditModalProduct] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get("/admin/products");
      setProducts(sortNewestFirst(res.data));
      setError("");
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
    () => categories.map((c) => String(c.name || "").trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const kw = searchTerm.trim().toLowerCase();
      const matchKw = !kw
        || item.name?.toLowerCase().includes(kw)
        || item.brand?.toLowerCase().includes(kw)
        || item.categoryName?.toLowerCase().includes(kw);

      const matchCat = categoryFilter === "ALL" || item.categoryName === categoryFilter;
      const matchVis = visibilityFilter === "ALL"
        || (visibilityFilter === "VISIBLE" && item.active)
        || (visibilityFilter === "HIDDEN" && !item.active);

      const stock = Number(item.stock || 0);
      const matchStock = stockFilter === "ALL"
        || (stockFilter === "LOW" && stock > 0 && stock <= 5)
        || (stockFilter === "OUT" && stock === 0)
        || (stockFilter === "AVAILABLE" && stock > 5);

      return matchKw && matchCat && matchVis && matchStock;
    });
  }, [products, searchTerm, categoryFilter, visibilityFilter, stockFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setVisibilityFilter("ALL");
    setStockFilter("ALL");
  };

  // --- Create form ---
  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreateImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axiosClient.post("/admin/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCreateForm((p) => ({ ...p, imageUrl: res.data.url }));
    } catch {
      setError("Tải ảnh thất bại.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    setError("");
    try {
      const payload = {
        name: createForm.name,
        brand: createForm.brand,
        price: Number(createForm.price),
        originalPrice: Number(createForm.originalPrice),
        stock: Number(createForm.stock),
        flashSale: Boolean(createForm.flashSale),
        flashSaleStartAt: Boolean(createForm.flashSale) ? normalizeDateTimeLocal(createForm.flashSaleStartAt) : null,
        flashSaleEndAt: Boolean(createForm.flashSale) ? normalizeDateTimeLocal(createForm.flashSaleEndAt) : null,
        flashSaleQuantity: Boolean(createForm.flashSale) ? Number(createForm.flashSaleQuantity || 0) : 0,
        flashSaleSold: Boolean(createForm.flashSale) ? Number(createForm.flashSaleSold || 0) : 0,
        imageUrl: createForm.imageUrl,
        description: createForm.description,
        categoryName: createForm.category,
        active: createForm.active,
      };
      await axiosClient.post("/admin/products", payload);
      setCreateMsg("Thêm sản phẩm thành công.");
      setCreateForm(createEmptyForm());
      await fetchProducts();
      await fetchCategories();
    } catch (err) {
      setError(getProductErrorMessage(err, "Thêm sản phẩm thất bại."));
    } finally {
      setCreating(false);
    }
  };

  // --- Edit modal ---
  const openEditModal = (product) => {
    setEditModalProduct(product);
    setEditForm({
      name: product.name || "",
      brand: product.brand || "",
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      stock: product.stock || 0,
      flashSale: Boolean(product.flashSale),
      flashSaleStartAt: toDateTimeLocalValue(product.flashSaleStartAt),
      flashSaleEndAt: toDateTimeLocalValue(product.flashSaleEndAt),
      flashSaleQuantity: product.flashSaleQuantity || 0,
      flashSaleSold: product.flashSaleSold || 0,
      imageUrl: product.imageUrl || "",
      description: product.description || "",
      category: product.categoryName || "",
      active: !!product.active,
    });
    setEditError("");
  };

  const closeEditModal = () => { setEditModalProduct(null); setEditForm(createEmptyForm()); setEditError(""); };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axiosClient.post("/admin/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditForm((p) => ({ ...p, imageUrl: res.data.url }));
    } catch {
      setEditError("Tải ảnh thất bại.");
    } finally {
      setEditUploadingImage(false);
      e.target.value = "";
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const payload = {
        name: editForm.name,
        brand: editForm.brand,
        price: Number(editForm.price),
        originalPrice: Number(editForm.originalPrice),
        stock: Number(editForm.stock),
        flashSale: Boolean(editForm.flashSale),
        flashSaleStartAt: Boolean(editForm.flashSale) ? normalizeDateTimeLocal(editForm.flashSaleStartAt) : null,
        flashSaleEndAt: Boolean(editForm.flashSale) ? normalizeDateTimeLocal(editForm.flashSaleEndAt) : null,
        flashSaleQuantity: Boolean(editForm.flashSale) ? Number(editForm.flashSaleQuantity || 0) : 0,
        flashSaleSold: Boolean(editForm.flashSale) ? Number(editForm.flashSaleSold || 0) : 0,
        imageUrl: editForm.imageUrl,
        description: editForm.description,
        categoryName: editForm.category,
        active: editForm.active,
      };
      await axiosClient.put(`/admin/products/${editModalProduct.id}`, payload);
      await fetchProducts();
      await fetchCategories();
      closeEditModal();
    } catch (err) {
      setEditError(getProductErrorMessage(err, "Cập nhật thất bại."));
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await axiosClient.delete(`/admin/products/${id}`);
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa sản phẩm thất bại.");
    }
  };

  return (
    <AdminShell
      title="Quản lý sản phẩm"
      subtitle="Thêm, chỉnh sửa và theo dõi tồn kho sản phẩm."
    >
      <section className="page-gap">

        {error && <div className="admin-flash error">{error}</div>}

        {/* Form tạo sản phẩm mới */}
        <div className="card p-lg">
          <h2>Thêm sản phẩm mới</h2>
          <form className="form-grid" onSubmit={handleCreateSubmit}>
            <input className="input" name="name" placeholder="Tên sản phẩm" value={createForm.name} onChange={handleCreateChange} required />
            <input className="input" name="brand" placeholder="Thương hiệu" value={createForm.brand} onChange={handleCreateChange} />
            <input className="input" name="price" type="number" placeholder="Giá bán" value={createForm.price} onChange={handleCreateChange} required />
            <input className="input" name="originalPrice" type="number" placeholder="Giá gốc" value={createForm.originalPrice} onChange={handleCreateChange} />
            <input className="input" name="stock" type="number" placeholder="Tồn kho" value={createForm.stock} onChange={handleCreateChange} required />
            <input className="input" name="category" list="cat-options-create" placeholder="Danh mục" value={createForm.category} onChange={handleCreateChange} />
            <datalist id="cat-options-create">
              {categoryOptions.map((c) => <option key={c} value={c} />)}
            </datalist>

            <label className="checkbox-row grid-span-2 admin-flash-toggle">
              <input type="checkbox" name="flashSale" checked={createForm.flashSale} onChange={handleCreateChange} />
              Bật chương trình flash sale cho sản phẩm này
            </label>

            {createForm.flashSale && (
              <div className="grid-span-2 admin-flash-sale-fields">
                <div className="modal-field">
                  <label>Bắt đầu</label>
                  <input className="input" name="flashSaleStartAt" type="datetime-local" value={createForm.flashSaleStartAt} onChange={handleCreateChange} />
                </div>
                <div className="modal-field">
                  <label>Kết thúc</label>
                  <input className="input" name="flashSaleEndAt" type="datetime-local" value={createForm.flashSaleEndAt} onChange={handleCreateChange} />
                </div>
                <div className="modal-field">
                  <label>Số suất flash sale</label>
                  <input className="input" name="flashSaleQuantity" type="number" min="0" value={createForm.flashSaleQuantity} onChange={handleCreateChange} />
                </div>
                <div className="modal-field">
                  <label>Đã bán</label>
                  <input className="input" name="flashSaleSold" type="number" min="0" value={createForm.flashSaleSold} onChange={handleCreateChange} />
                </div>
              </div>
            )}

            <div className="grid-span-2 admin-image-upload">
              <div className="admin-image-preview">
                {createForm.imageUrl ? (
                  <img src={getProductImageUrl({ ...createForm, name: createForm.name || "SP" })} alt="preview" />
                ) : <span>Chưa có ảnh</span>}
              </div>
              <div className="admin-image-upload-panel">
                <label className="admin-file-trigger" htmlFor="create-img-upload">
                  {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
                </label>
                <input id="create-img-upload" type="file" accept="image/*" onChange={handleCreateImageUpload} disabled={uploadingImage} className="admin-file-input" />
                <input className="input" name="imageUrl" placeholder="Hoặc dán URL ảnh" value={createForm.imageUrl} onChange={handleCreateChange} />
              </div>
            </div>

            <textarea className="input grid-span-2 textarea" name="description" placeholder="Mô tả sản phẩm" value={createForm.description} onChange={handleCreateChange} />
            <label className="checkbox-row grid-span-2">
              <input type="checkbox" name="active" checked={createForm.active} onChange={handleCreateChange} />
              Hiển thị sản phẩm trên website
            </label>

            <div className="grid-span-2 admin-product-live-preview">
              <div className="admin-product-live-head">
                <span>Xem trước sản phẩm</span>
                <strong>{createForm.active ? "Đang hiển thị" : "Đang ẩn"}</strong>
              </div>
              <div className="admin-product-live-body">
                <div className="admin-product-live-media">
                  <img
                    src={getProductImageUrl({ ...createForm, category: createForm.category, name: createForm.name || "Sản phẩm" })}
                    alt={createForm.name || "Xem trước sản phẩm"}
                    onError={(e) => handleProductImageError(e, { ...createForm, category: createForm.category, name: createForm.name || "Sản phẩm" })}
                  />
                </div>
                <div className="admin-product-live-info">
                  <div className="admin-product-live-tags">
                    <span>{createForm.brand?.trim() || "Thương hiệu"}</span>
                    <span>{createForm.category?.trim() || "Danh mục"}</span>
                    {createForm.flashSale && <span className="admin-flash-live-tag">Flash sale</span>}
                  </div>
                  <h3>{createForm.name?.trim() || "Tên sản phẩm sẽ hiện ở đây"}</h3>
                  <p>{createForm.description?.trim() || "Mô tả sản phẩm sẽ hiện ngay khi bạn nhập để dễ hình dung nội dung trên website."}</p>
                  <div className="admin-product-live-price">
                    <strong>{formatProductCurrency(createForm.price)}</strong>
                    {Number(createForm.originalPrice || 0) > Number(createForm.price || 0) && (
                      <span>{formatProductCurrency(createForm.originalPrice)}</span>
                    )}
                  </div>
                  <div className="admin-product-live-meta">
                    <span>Tồn kho: {Number(createForm.stock || 0)}</span>
                    <span>{createForm.active ? "Có thể bán" : "Chưa hiển thị ngoài web"}</span>
                  </div>
                </div>
              </div>
            </div>

            {createMsg && <div className="success-box grid-span-2">{createMsg}</div>}
            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Thêm sản phẩm"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setCreateForm(createEmptyForm())}>Làm mới</button>
            </div>
          </form>
        </div>

        {/* Bộ lọc */}
        <div className="card p-lg">
          <div className="admin-section-head">
            <div>
              <span className="admin-panel-kicker">BỘ LỌC SẢN PHẨM</span>
              <h2>Tra cứu nhanh danh sách sản phẩm</h2>
            </div>
          </div>
          <div className="admin-toolbar-grid">
            <input className="input admin-search-input" placeholder="Tìm theo tên, thương hiệu, danh mục" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="input admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">Tất cả danh mục</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input admin-select" value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="VISIBLE">Đang hiển thị</option>
              <option value="HIDDEN">Đang ẩn</option>
            </select>
            <select className="input admin-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="ALL">Mọi mức tồn kho</option>
              <option value="LOW">Sắp hết hàng</option>
              <option value="OUT">Hết hàng</option>
              <option value="AVAILABLE">Còn hàng tốt</option>
            </select>
          </div>
          <div className="admin-summary-strip">
            <span className="admin-summary-pill">Tổng: {products.length}</span>
            <span className="admin-summary-pill">Kết quả: {filteredProducts.length}</span>
            <span className="admin-summary-pill">Hiển thị: {products.filter((p) => p.active).length}</span>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        </div>

        {/* Bảng sản phẩm */}
        <div className="card p-lg overflow-x">
          <h2>Danh sách sản phẩm</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Flash</th>
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
                  <td className="td-id">{item.id}</td>
                  <td>
                    <span className={`role-badge role-${item.flashSaleActive ? "admin" : "user"}`}>
                      {getFlashSaleText(item)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-image">
                      {item.imageUrl ? (
                        <img src={getProductImageUrl(item)} alt={item.name} onError={(e) => handleProductImageError(e, item)} />
                      ) : <span>--</span>}
                    </div>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.categoryName}</td>
                  <td>{Number(item.price || 0).toLocaleString("vi-VN")} đ</td>
                  <td>{item.stock}</td>
                  <td>
                    <span className={`role-badge role-${item.active ? "admin" : "user"}`}>
                      {item.active ? "Có" : "Không"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>Sửa</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr><td colSpan="9" className="table-empty-cell">Không có sản phẩm phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Sửa sản phẩm */}
      {editModalProduct && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Chỉnh sửa sản phẩm</h3>
            <p className="modal-subtitle">#{editModalProduct.id} - {editModalProduct.name}</p>
            <form onSubmit={saveEdit}>
              <div className="modal-form-grid">
                <div className="modal-field">
                  <label>Tên sản phẩm</label>
                  <input className="input" name="name" value={editForm.name} onChange={handleEditChange} required autoFocus />
                </div>
                <div className="modal-field">
                  <label>Thương hiệu</label>
                  <input className="input" name="brand" value={editForm.brand} onChange={handleEditChange} />
                </div>
                <div className="modal-field">
                  <label>Giá bán</label>
                  <input className="input" name="price" type="number" value={editForm.price} onChange={handleEditChange} required />
                </div>
                <div className="modal-field">
                  <label>Giá gốc</label>
                  <input className="input" name="originalPrice" type="number" value={editForm.originalPrice} onChange={handleEditChange} />
                </div>
                <div className="modal-field">
                  <label>Tồn kho</label>
                  <input className="input" name="stock" type="number" value={editForm.stock} onChange={handleEditChange} required />
                </div>
                <div className="modal-field">
                  <label>Danh mục</label>
                  <input className="input" name="category" list="cat-options-edit" value={editForm.category} onChange={handleEditChange} />
                  <datalist id="cat-options-edit">
                    {categoryOptions.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <label className="checkbox-row admin-flash-toggle">
                <input type="checkbox" name="flashSale" checked={editForm.flashSale} onChange={handleEditChange} />
                Bật chương trình flash sale cho sản phẩm này
              </label>

              {editForm.flashSale && (
                <div className="admin-flash-sale-fields admin-flash-sale-fields-modal">
                  <div className="modal-field">
                    <label>Bắt đầu</label>
                    <input className="input" name="flashSaleStartAt" type="datetime-local" value={editForm.flashSaleStartAt} onChange={handleEditChange} />
                  </div>
                  <div className="modal-field">
                    <label>Kết thúc</label>
                    <input className="input" name="flashSaleEndAt" type="datetime-local" value={editForm.flashSaleEndAt} onChange={handleEditChange} />
                  </div>
                  <div className="modal-field">
                    <label>Số suất flash sale</label>
                    <input className="input" name="flashSaleQuantity" type="number" min="0" value={editForm.flashSaleQuantity} onChange={handleEditChange} />
                  </div>
                  <div className="modal-field">
                    <label>Đã bán</label>
                    <input className="input" name="flashSaleSold" type="number" min="0" value={editForm.flashSaleSold} onChange={handleEditChange} />
                  </div>
                </div>
              )}

              <div className="modal-image-section">
                <label>Ảnh sản phẩm</label>
                <div className="modal-image-row">
                  <div className="admin-image-preview">
                    {editForm.imageUrl ? (
                      <img src={getProductImageUrl({ ...editForm, name: editForm.name || "SP" })} alt="preview" />
                    ) : <span>Chưa có ảnh</span>}
                  </div>
                  <div>
                    <label className="admin-file-trigger" htmlFor="edit-img-upload">
                      {editUploadingImage ? "Đang tải..." : "Chọn ảnh"}
                    </label>
                    <input id="edit-img-upload" type="file" accept="image/*" onChange={handleEditImageUpload} disabled={editUploadingImage} className="admin-file-input" />
                    <input className="input" name="imageUrl" placeholder="Hoặc dán URL" value={editForm.imageUrl} onChange={handleEditChange} style={{ marginTop: 8 }} />
                  </div>
                </div>
              </div>

              <div className="modal-field">
                <label>Mô tả</label>
                <textarea className="input textarea" name="description" value={editForm.description} onChange={handleEditChange} rows={3} />
              </div>

              <label className="checkbox-row">
                <input type="checkbox" name="active" checked={editForm.active} onChange={handleEditChange} />
                Hiển thị sản phẩm trên website
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
