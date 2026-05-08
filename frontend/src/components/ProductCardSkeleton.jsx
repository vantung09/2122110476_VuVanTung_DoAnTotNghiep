export default function ProductCardSkeleton() {
  return (
    <div className="product-card tz-skeleton-card" aria-hidden="true">
      <div className="tz-skeleton-img" />
      <div className="tz-skeleton-body">
        <div className="tz-skeleton-line wide" />
        <div className="tz-skeleton-line" />
        <div className="tz-skeleton-line medium" />
        <div className="tz-skeleton-price" />
        <div className="tz-skeleton-actions">
          <div className="tz-skeleton-btn" />
          <div className="tz-skeleton-btn" />
        </div>
      </div>
    </div>
  );
}
