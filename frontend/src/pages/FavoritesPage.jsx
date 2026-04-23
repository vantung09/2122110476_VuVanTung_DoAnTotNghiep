import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import { useAuth } from "../contexts/AuthContext";
import supabase from "../api/supabaseClient";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

function generateSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function FavoritesPage() {
  const { items, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareError, setShareError] = useState("");
  const [shareTitle, setShareTitle] = useState("Danh sách yêu thích của tôi");
  const [showShareForm, setShowShareForm] = useState(false);

  const handleShare = async () => {
    if (!user) {
      setShareError("Vui lòng đăng nhập để chia sẻ danh sách yêu thích.");
      return;
    }
    if (items.length === 0) return;

    setShareLoading(true);
    setShareError("");
    setShareLink("");

    try {
      const slug = generateSlug();
      const userId = user.userId || user.email;
      const userName = user.fullName || user.email || "Khach";

      const { error } = await supabase.from("shared_wishlists").insert({
        user_id: userId,
        user_name: userName,
        slug,
        title: shareTitle.trim() || "Danh sách yêu thích",
        product_ids: items.map((i) => i.id),
        product_data: items.map((i) => ({
          id: i.id,
          name: i.name,
          imageUrl: i.imageUrl,
          price: i.price,
          originalPrice: i.originalPrice,
          category: i.category,
          brand: i.brand,
        })),
      });

      if (error) throw error;
      setShareLink(`${window.location.origin}/wishlist/${slug}`);
    } catch {
      setShareError("Không thể tạo liên kết chia sẻ. Vui lòng thử lại.");
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
    }
  };

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="storefront-count-badge">{items.length} sản phẩm</span>
            {user ? (
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => setShowShareForm(!showShareForm)}
              >
                {showShareForm ? "Hủy" : "Chia sẻ danh sách"}
              </button>
            ) : null}
          </div>
        </div>

        {showShareForm ? (
          <div className="card share-form-card">
            <h3>Chia sẻ danh sách yêu thích</h3>
            <input
              className="input"
              placeholder="Tiêu đề danh sách"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
            />
            {shareLink ? (
              <div className="share-link-box">
                <input className="input" value={shareLink} readOnly />
                <button className="btn btn-primary btn-sm" type="button" onClick={copyShareLink}>
                  Sao chép
                </button>
              </div>
            ) : null}
            {shareError ? <div className="error-box">{shareError}</div> : null}
            {!shareLink ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleShare}
                disabled={shareLoading}
              >
                {shareLoading ? "Đang tạo..." : "Tạo liên kết chia sẻ"}
              </button>
            ) : (
              <p className="success-box">Liên kết đã được tạo! Sao chép và gửi cho bạn bè.</p>
            )}
          </div>
        ) : null}

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
