import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import supabase from "../api/supabaseClient";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

export default function SharedWishlistPage() {
  const { slug } = useParams();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    const fetchWishlist = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("shared_wishlists")
          .select("*")
          .eq("slug", slug)
          .eq("active", true)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          if (mounted) setError("Danh sách yêu thích không tồn tại hoặc đã bị xóa.");
          return;
        }

        if (mounted) setWishlist(data);

        await supabase
          .from("shared_wishlists")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", data.id);
      } catch {
        if (mounted) setError("Không tải được danh sách yêu thích.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWishlist();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return <div className="storefront-section-panel">Đang tải danh sách...</div>;
  }

  if (error || !wishlist) {
    return (
      <section className="storefront-section-panel storefront-empty">
        <h2>{error || "Không tìm thấy danh sách"}</h2>
        <Link to="/">Quay lại trang chủ</Link>
      </section>
    );
  }

  const products = wishlist.product_data || [];

  return (
    <div className="storefront-stack">
      <section className="storefront-section-panel">
        <div className="storefront-heading-row">
          <div>
            <h1 className="storefront-panel-title">{wishlist.title}</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              Chia sẻ bởi {wishlist.user_name} &middot; {wishlist.view_count || 0} lượt xem
            </p>
          </div>
          <span className="storefront-count-badge">{products.length} sản phẩm</span>
        </div>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, index) => (
              <article key={product.id || index} className="favorite-card card">
                <div className="favorite-image">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    onError={(e) => handleProductImageError(e, product)}
                  />
                </div>
                <div className="favorite-info">
                  <p className="favorite-category">{product.category}</p>
                  <h3>{product.name}</h3>
                  <div className="favorite-price">
                    <strong>{Number(product.price || 0).toLocaleString("vi-VN")} đ</strong>
                    {product.originalPrice ? (
                      <span className="product-old-price">
                        {Number(product.originalPrice).toLocaleString("vi-VN")} đ
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="favorite-actions">
                  <Link to={`/products/${product.id}`} className="btn btn-primary">
                    Xem chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="storefront-empty">Danh sách chưa có sản phẩm.</div>
        )}
      </section>
    </div>
  );
}
