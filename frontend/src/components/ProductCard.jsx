import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";

const CAPACITY_OPTIONS = ["128GB", "256GB", "512GB"];

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const name = product?.name || "";
  const isIphone = /iphone/i.test(product?.category || "") || /iphone/i.test(name);
  const selectedCapacity = CAPACITY_OPTIONS.find((opt) => name.toUpperCase().includes(opt));
  const favorite = isFavorite(product.id);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image-wrap">
        <img
          src={product.imageUrl || "https://via.placeholder.com/300x240?text=No+Image"}
          alt={product.name}
          className="product-image"
        />
      </div>

      {isIphone && (
        <div className="product-variants">
          {CAPACITY_OPTIONS.map((opt) => (
            <span
              key={opt}
              className={`variant-chip ${selectedCapacity === opt ? "active" : ""}`}
            >
              {opt}
            </span>
          ))}
        </div>
      )}

      <div className="product-content">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price-wrap">
          <span className="product-price">{Number(product.price || 0).toLocaleString()} đ</span>
          {product.originalPrice ? (
            <span className="product-old-price">{Number(product.originalPrice).toLocaleString()} đ</span>
          ) : null}
        </div>
      </div>

      <div className="product-actions">
        <button className="action-btn primary" type="button" onClick={handleAddToCart}>
          <span className="action-icon" aria-hidden="true">
            <img src="/icons/cart.png" alt="" />
          </span>
          <span>Thêm vào giỏ</span>
        </button>
        <button
          className={`action-btn outline ${favorite ? "active" : ""}`}
          type="button"
          onClick={handleToggleFavorite}
        >
          <span className="action-icon" aria-hidden="true">
            <img src="/icons/heart.png" alt="" />
          </span>
          <span>{favorite ? "Đã thích" : "Yêu thích"}</span>
        </button>
      </div>
    </Link>
  );
}
