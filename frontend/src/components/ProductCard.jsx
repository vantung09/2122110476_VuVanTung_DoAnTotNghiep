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

function formatPrice(price) {
  return Number(price || 0).toLocaleString("vi-VN");
}

function getFlashSaleRemaining(product, stock) {
  const value = Number(product?.flashSaleRemaining);
  if (Number.isFinite(value) && value >= 0) return value;
  return stock;
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [cartAnimated, setCartAnimated] = useState(false);
  const [favoriteAnimated, setFavoriteAnimated] = useState(false);

  const name = product?.name || "";
  const category = product?.categoryName || "San pham";
  const isIphone = /iphone/i.test(product?.categoryName || "") || /iphone/i.test(name);
  const selectedCapacity = CAPACITY_OPTIONS.find((opt) => name.toUpperCase().includes(opt));
  const favorite = isFavorite(product.id);
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const discountPercent =
    originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  const stock = Number(product.stock || 0);
  const isOutOfStock = stock === 0;
  const flashSaleActive = Boolean(product?.flashSaleActive);
  const flashSaleRemaining = getFlashSaleRemaining(product, stock);
  const flashSaleTotal = Number(product?.flashSaleQuantity || 0) > 0
    ? Number(product.flashSaleQuantity || 0)
    : stock;
  const flashSalePercent = flashSaleTotal > 0
    ? Math.max(0, Math.min(100, (flashSaleRemaining / flashSaleTotal) * 100))
    : 0;

  const triggerCart = () => {
    setCartAnimated(true);
    window.setTimeout(() => setCartAnimated(false), 700);
  };

  const triggerFavorite = () => {
    setFavoriteAnimated(true);
    window.setTimeout(() => setFavoriteAnimated(false), 700);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    triggerCart();
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
    triggerFavorite();
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className={`product-card tz-product-card ${isOutOfStock ? "out-of-stock" : ""} ${flashSaleActive ? "is-flash-sale" : ""}`}
      aria-label={`${name} – ${formatPrice(price)} đ`}
    >
      {/* Image section */}
      <div className="product-image-wrap">
        {/* Badges */}
        <div className="product-badges">
          <span className="product-badge">{category}</span>
          {flashSaleActive && (
            <span className="product-badge product-badge-flash">
              Flash sale
            </span>
          )}
          {discountPercent > 0 && (
            <span className="product-badge product-badge-sale tz-sale-badge">
              -{discountPercent}%
            </span>
          )}
        </div>

        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          className="product-image"
          onError={(e) => handleProductImageError(e, product)}
          loading="lazy"
        />

        {flashSaleActive && (
          <div className="tz-flash-deal-ribbon">
            Đang săn deal
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="tz-outofstock-overlay">
            <span>Hết hàng</span>
          </div>
        )}
      </div>

      {/* Capacity chips for iPhone */}
      {isIphone && (
        <div className="product-variants">
          {CAPACITY_OPTIONS.map((opt) => (
            <span key={opt} className={`variant-chip ${selectedCapacity === opt ? "active" : ""}`}>
              {opt}
            </span>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="product-content">
        <div className="product-meta">
          <span className="product-brand-line">{product.brand || "Apple"}</span>
          {!isOutOfStock && (
            <span className={`product-stock ${stock <= 5 ? "low" : ""}`}>
              {stock <= 5 ? `Còn ${stock}` : "Còn hàng"}
            </span>
          )}
        </div>
        <h3 className="product-name">{name}</h3>
        <div className="product-price-wrap">
          <span className="product-price">{formatPrice(price)} đ</span>
          {originalPrice > price && (
            <span className="product-old-price">{formatPrice(originalPrice)} đ</span>
          )}
        </div>

        {/* Savings callout */}
        {discountPercent >= 5 && (
          <div className="tz-savings-tag">
            Tiết kiệm {formatPrice(originalPrice - price)} đ
          </div>
        )}
        {flashSaleActive && (
          <div className="tz-flash-card-meter">
            <div className="tz-flash-card-meter-head">
              <span>Flash sale đang chạy</span>
              <strong>Còn {flashSaleRemaining} suất</strong>
            </div>
            <div className="tz-flash-card-progress" aria-hidden="true">
              <i style={{ width: `${Math.max(8, flashSalePercent)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="product-actions product-actions-premium">
        <StoreActionButton
          variant="cart"
          active={cartAnimated}
          animated={cartAnimated}
          onClick={handleAddToCart}
          icon={cartAnimated ? <StoreCheckIcon /> : <StoreBagIcon />}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Hết hàng" : cartAnimated ? "Đã thêm!" : "Thêm vào giỏ"}
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
