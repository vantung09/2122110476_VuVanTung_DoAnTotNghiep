import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AdminMenu from "../../components/AdminMenu";

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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get("/admin/products");
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được sản phẩm");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setMessage("Cập nhật sản phẩm thành công");
      } else {
        await axiosClient.post("/admin/products", payload);
        setMessage("Thêm sản phẩm thành công");
      }

      setForm(emptyForm);
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Lưu sản phẩm thất bại");
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
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await axiosClient.delete(`/admin/products/${id}`);
      setMessage("Xóa sản phẩm thành công");
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa sản phẩm thất bại");
    }
  };

  return (
    <div className="admin-layout">
      <AdminMenu />
      <section className="admin-content page-gap">
        <div className="card p-lg">
          <h1>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h1>
          <form className="form-grid" onSubmit={handleSubmit}>
            <input className="input" name="name" placeholder="Tên sản phẩm" value={form.name} onChange={handleChange} />
            <input className="input" name="brand" placeholder="Thương hiệu" value={form.brand} onChange={handleChange} />
            <input className="input" name="price" type="number" placeholder="Giá bán" value={form.price} onChange={handleChange} />
            <input className="input" name="originalPrice" type="number" placeholder="Giá gốc" value={form.originalPrice} onChange={handleChange} />
            <input className="input" name="stock" type="number" placeholder="Tồn kho" value={form.stock} onChange={handleChange} />
            <input className="input" name="category" placeholder="Danh mục" value={form.category} onChange={handleChange} />
            <input className="input grid-span-2" name="imageUrl" placeholder="URL hình ảnh" value={form.imageUrl} onChange={handleChange} />
            <textarea className="input grid-span-2 textarea" name="description" placeholder="Mô tả sản phẩm" value={form.description} onChange={handleChange} />
            <label className="checkbox-row grid-span-2">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              Hiển thị sản phẩm
            </label>

            {message ? <div className="success-box grid-span-2">{message}</div> : null}
            {error ? <div className="error-box grid-span-2">{error}</div> : null}

            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit">
                {editingId ? "Cập nhật" : "Thêm mới"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        <div className="card p-lg overflow-x">
          <h2>Danh sách sản phẩm</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn</th>
                <th>Hiển thị</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{Number(item.price || 0).toLocaleString()} đ</td>
                  <td>{item.stock}</td>
                  <td>{item.active ? "Có" : "Không"}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>Sửa</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
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
