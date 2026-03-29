import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";

const CAPACITY_OPTIONS = ["128GB", "256GB", "512GB"];
const COLOR_OPTIONS = [
  { name: "Đen", value: "#2e2e2e" },
  { name: "Trắng", value: "#f0f0f0" },
  { name: "Xanh", value: "#5a7aa6" },
  { name: "Hồng", value: "#d7a3b5" },
  { name: "Vàng", value: "#cbb27a" },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCapacity, setSelectedCapacity] = useState(CAPACITY_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].name);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosClient.get(`/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const match = CAPACITY_OPTIONS.find((opt) =>
      (product.name || "").toUpperCase().includes(opt)
    );
    setSelectedCapacity(match || CAPACITY_OPTIONS[0]);
  }, [product]);

  if (loading) return <div className="card p-lg">Đang tải...</div>;
  if (!product) return <div className="card p-lg">Không tìm thấy sản phẩm.</div>;

  const name = product.name || "";
  const isIphone = /iphone/i.test(product.category || "") || /iphone/i.test(name);
  const favorite = isFavorite(product.id);

  return (
    <div className="detail-layout">
      <div className="detail-image card">
        <img
          src={product.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}
          alt={product.name}
        />
      </div>
      <div className="detail-content card">
        <p className="product-brand">{product.brand}</p>
        <h1>{product.name}</h1>
        <div className="detail-price-wrap">
          <span className="detail-price">{Number(product.price || 0).toLocaleString()} đ</span>
          {product.originalPrice ? (
            <span className="product-old-price">{Number(product.originalPrice).toLocaleString()} đ</span>
          ) : null}
        </div>
        <div className="detail-actions">
          <button
            className="btn btn-primary btn-icon"
            type="button"
            onClick={() => addToCart(product, 1)}
          >
            <span className="action-icon" aria-hidden="true">
              <img src="/icons/cart.png" alt="" />
            </span>
            Thêm vào giỏ hàng
          </button>
          <button
            className={`btn btn-secondary btn-icon ${favorite ? "btn-favorite" : ""}`}
            type="button"
            onClick={() => toggleFavorite(product)}
          >
            <span className="action-icon" aria-hidden="true">
              <img src="/icons/heart.png" alt="" />
            </span>
            {favorite ? "Đã yêu thích" : "Yêu thích"}
          </button>
        </div>
        {isIphone && (
          <>
            <div className="detail-option">
              <p>Dung lượng</p>
              <div className="option-row">
                {CAPACITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`option-chip ${selectedCapacity === opt ? "active" : ""}`}
                    onClick={() => setSelectedCapacity(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="detail-option">
              <p>Màu: {selectedColor}</p>
              <div className="color-row">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className={`color-dot ${selectedColor === color.name ? "active" : ""}`}
                    style={{ background: color.value }}
                    onClick={() => setSelectedColor(color.name)}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        <p><strong>Danh mục:</strong> {product.category || "Đang cập nhật"}</p>
        <p><strong>Tồn kho:</strong> {product.stock}</p>
        <p><strong>Trạng thái:</strong> {product.active ? "Đang bán" : "Tạm ẩn"}</p>
        <div className="description-box">
          <h3>Mô tả</h3>
          <p>{product.description || "Chưa có mô tả sản phẩm."}</p>
        </div>
      </div>
    </div>
  );
}
