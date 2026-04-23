import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

export default function FavoritesPage() {
  const { items, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="storefront-section-panel storefront-empty">
        <h2>Danh sách yêu thích đang trống</h2>
        <p>Hãy lưu lại những sản phẩm bạn quan tâm để xem lại nhanh hơn.</p>
        <Link to="/">Quay lại mua sắm</Link>
      </section>
    );
  }

  return (
    <div className="storefront-stack">
      <section className="storefront-section-panel">
        <div className="storefront-heading-row">
          <div>
            <h1 className="storefront-panel-title">Sản phẩm yêu thích</h1>
          </div>
          <span className="storefront-count-badge">{items.length} sản phẩm</span>
        </div>

        <div className="favorites-page">
          {items.map((item) => (
            <article key={item.id} className="favorite-card card">
              <div className="favorite-image">
                <img
                  src={getProductImageUrl(item)}
                  alt={item.name}
                  onError={(event) => handleProductImageError(event, item)}
                />
              </div>

              <div className="favorite-info">
                <p className="favorite-category">{item.category}</p>
                <h3>{item.name}</h3>
                <div className="favorite-price">
                  <strong>{Number(item.price || 0).toLocaleString("vi-VN")} đ</strong>
                  {item.originalPrice ? (
                    <span className="product-old-price">
                      {Number(item.originalPrice).toLocaleString("vi-VN")} đ
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="favorite-actions">
                <button className="btn btn-primary" type="button" onClick={() => addToCart(item, 1)}>
                  Thêm vào giỏ
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => toggleFavorite(item)}>
                  Bỏ yêu thích
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
