import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";
import StoreActionButton, {
  StoreBagIcon,
  StoreCheckIcon,
  StoreHeartIcon,
} from "./StoreActionButton";

const CAPACITY_OPTIONS = ["128GB", "256GB", "512GB"];

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [cartAnimated, setCartAnimated] = useState(false);
  const [favoriteAnimated, setFavoriteAnimated] = useState(false);

  const name = product?.name || "";
  const category = product?.category || "Sản phẩm";
  const isIphone = /iphone/i.test(product?.category || "") || /iphone/i.test(name);
  const selectedCapacity = CAPACITY_OPTIONS.find((opt) => name.toUpperCase().includes(opt));
  const favorite = isFavorite(product.id);
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const discountPercent =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  const stock = Number(product.stock || 0);

  const triggerCartAnimation = () => {
    setCartAnimated(true);
    window.setTimeout(() => setCartAnimated(false), 650);
  };

  const triggerFavoriteAnimation = () => {
    setFavoriteAnimated(true);
    window.setTimeout(() => setFavoriteAnimated(false), 650);
  };

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product, 1);
    triggerCartAnimation();
  };

  const handleToggleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product);
    triggerFavoriteAnimation();
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image-wrap">
        <div className="product-badges">
          <span className="product-badge">{category}</span>
          {discountPercent > 0 ? (
            <span className="product-badge product-badge-sale">-{discountPercent}%</span>
          ) : null}
        </div>

        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          className="product-image"
          onError={(event) => handleProductImageError(event, product)}
        />
      </div>

      {isIphone ? (
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
      ) : null}

      <div className="product-content">
        <div className="product-meta">
          <span className="product-brand-line">{product.brand || "Apple"}</span>
          <span className={`product-stock ${stock <= 5 ? "low" : ""}`}>
            {stock === 0 ? "Hết hàng" : stock <= 5 ? `Sắp hết hàng: ${stock}` : `Còn hàng: ${stock}`}
          </span>
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price-wrap">
          <span className="product-price">{price.toLocaleString("vi-VN")} đ</span>
          {originalPrice ? (
            <span className="product-old-price">{originalPrice.toLocaleString("vi-VN")} đ</span>
          ) : null}
        </div>
      </div>

      <div className="product-actions product-actions-premium">
        <StoreActionButton
          variant="cart"
          active={cartAnimated}
          animated={cartAnimated}
          onClick={handleAddToCart}
          icon={cartAnimated ? <StoreCheckIcon /> : <StoreBagIcon />}
        >
          {cartAnimated ? "Đã thêm giỏ" : "Thêm vào giỏ"}
        </StoreActionButton>

        <StoreActionButton
          variant="favorite"
          active={favorite}
          animated={favoriteAnimated}
          onClick={handleToggleFavorite}
          icon={<StoreHeartIcon filled={favorite} />}
        >
          {favorite ? "Đã thích" : "Yêu thích"}
        </StoreActionButton>
      </div>
    </Link>
  );
}
