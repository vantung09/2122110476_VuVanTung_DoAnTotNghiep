import { Link } from "react-router-dom";
import { useCompare } from "../contexts/CompareContext";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompare();

  if (items.length === 0) {
    return (
      <section className="storefront-section-panel storefront-empty">
        <h2>Chưa có sản phẩm để so sánh</h2>
        <p>Thêm tối đa 4 sản phẩm để so sánh tính năng và giá cả.</p>
        <Link to="/">Quay lại mua sắm</Link>
      </section>
    );
  }

  const specRows = [
    { label: "Giá bán", key: "price", format: (v) => `${Number(v || 0).toLocaleString("vi-VN")} đ` },
    { label: "Giá gốc", key: "originalPrice", format: (v) => v ? `${Number(v).toLocaleString("vi-VN")} đ` : "--" },
    { label: "Thương hiệu", key: "brand", format: (v) => v || "--" },
    { label: "Danh mục", key: "category", format: (v) => v || "--" },
    { label: "Tồn kho", key: "stock", format: (v) => `${v ?? 0} sản phẩm` },
    { label: "Trạng thái", key: "active", format: (v) => v ? "Đang bán" : "Tạm ẩn" },
  ];

  return (
    <div className="storefront-stack">
      <section className="storefront-section-panel">
        <div className="storefront-heading-row">
          <div>
            <h1 className="storefront-panel-title">So sánh sản phẩm</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="storefront-count-badge">{items.length}/4 sản phẩm</span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={clearCompare}>
              Xóa tất cả
            </button>
          </div>
        </div>

        <div className="compare-page">
          <div className="compare-grid" style={{ gridTemplateColumns: `180px repeat(${items.length}, 1fr)` }}>
            <div className="compare-label-cell" />
            {items.map((item) => (
              <div key={item.id} className="compare-product-header">
                <div className="compare-product-image">
                  <img
                    src={getProductImageUrl(item)}
                    alt={item.name}
                    onError={(e) => handleProductImageError(e, item)}
                  />
                </div>
                <Link to={`/products/${item.id}`} className="compare-product-name">
                  {item.name}
                </Link>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                >
                  Xóa
                </button>
              </div>
            ))}

            {specRows.map((row) => (
              <div key={row.key} className="compare-row">
                <div className="compare-label-cell">
                  <strong>{row.label}</strong>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="compare-value-cell">
                    {row.format(item[row.key])}
                  </div>
                ))}
              </div>
            ))}

            <div className="compare-row">
              <div className="compare-label-cell">
                <strong>Mô tả</strong>
              </div>
              {items.map((item) => (
                <div key={item.id} className="compare-value-cell">
                  <p className="compare-description">
                    {item.description || "Đang cập nhật"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
