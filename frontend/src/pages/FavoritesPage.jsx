import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";

export default function FavoritesPage() {
  const { items, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="card p-lg">
        Danh sách yêu thích đang trống. <Link to="/">Quay lại mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      {items.map((item) => (
        <div key={item.id} className="favorite-card card">
          <div className="favorite-image">
            <img src={item.imageUrl} alt={item.name} />
          </div>
          <div className="favorite-info">
            <h3>{item.name}</h3>
            <p className="muted">{item.category}</p>
            <div className="favorite-price">
              <strong>{Number(item.price || 0).toLocaleString()} đ</strong>
              {item.originalPrice ? (
                <span className="product-old-price">
                  {Number(item.originalPrice).toLocaleString()} đ
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
        </div>
      ))}
    </div>
  );
}
