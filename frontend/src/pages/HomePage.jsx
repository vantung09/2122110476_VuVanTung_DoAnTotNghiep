import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import flashSaleLogo from "../assets/flashsale-logo.svg";
import ProductCard from "../components/ProductCard";
import SearchHistoryDropdown from "../components/SearchHistoryDropdown";
import { useSearchHistory } from "../contexts/SearchHistoryContext";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import { StoreBagIcon, StoreCheckIcon, StoreHeartIcon } from "../components/StoreActionButton";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

const CATEGORY_CHIPS = [
  { key: "", label: "Tất cả", icon: "✦" },
  { key: "iphone", label: "iPhone", icon: "📱" },
  { key: "mac", label: "Mac", icon: "💻" },
  { key: "ipad", label: "iPad", icon: "🖥" },
  { key: "watch", label: "Watch", icon: "⌚" },
  { key: "tainghe", label: "Tai nghe, Loa", icon: "🎧" },
  { key: "phukien", label: "Phụ kiện", icon: "🔌" },
];

const SORT_OPTIONS = [
  { key: "featured", label: "Nổi bật" },
  { key: "newest", label: "Mới nhất" },
  { key: "discount", label: "Giảm sâu" },
  { key: "priceAsc", label: "Giá tăng dần" },
  { key: "priceDesc", label: "Giá giảm dần" },
];

const PRICE_RANGES = [
  { key: "", label: "Mọi mức giá" },
  { key: "0-5", label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { key: "5-15", label: "5 – 15 triệu", min: 5000000, max: 15000000 },
  { key: "15-30", label: "15 – 30 triệu", min: 15000000, max: 30000000 },
  { key: "30+", label: "Trên 30 triệu", min: 30000000, max: Infinity },
];

const HOMEPAGE_BANNERS = [
  { id: "b1", imageUrl: "/banners/0563809d876094fa2bb7606be2055307.png", alt: "Banner 1" },
  { id: "b2", imageUrl: "/banners/38356f3a92241b0370c46bd784756025.png", alt: "Banner 2" },
  { id: "b3", imageUrl: "/banners/9a9b662b46b6c9bc3c4db6d4ebc6c2b8.jpg", alt: "Banner 3" },
  { id: "b4", imageUrl: "/banners/d0b16b549d82743e1793bef778366361.png", alt: "Banner 4" },
  { id: "b5", imageUrl: "/banners/ee47b489951f3039bfad24e9840c66a8.png", alt: "Banner 5" },
  { id: "b6", imageUrl: "/banners/fafecfcac0d54395454c28fd5a6bcc84.jpg", alt: "Banner 6" },
];

const HOME_POLICIES = [
  { icon: "🏆", title: "Hàng chính hãng", desc: "Apple VN/A, tem niêm phong nguyên đai." },
  { icon: "🚀", title: "Giao hàng toàn quốc", desc: "Nội thành 2–4h, tỉnh thành 1–3 ngày." },
  { icon: "🛡", title: "Bảo hành rõ ràng", desc: "Tiếp nhận tại hệ thống, theo dõi online." },
  { icon: "🔄", title: "Đổi trả trong 7 ngày", desc: "Miễn phí nếu lỗi nhà sản xuất." },
];

const GROUP_MAP = {
  iphone: ["iphone"],
  mac: ["mac"],
  ipad: ["ipad"],
  watch: ["watch"],
  tainghe: ["tai nghe", "am thanh", "loa"],
  phukien: ["phu kien", "phukien"],
};

function normalizeText(value) {
  if (!value) return "";
  return value.toString().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesCategory(cat, key) {
  if (!key) return true;
  const norm = normalizeText(cat);
  const targets = GROUP_MAP[key] || [key];
  return targets.some((t) => norm.includes(normalizeText(t)));
}

function matchesPriceRange(price, rangeKey) {
  if (!rangeKey) return true;
  const r = PRICE_RANGES.find((x) => x.key === rangeKey);
  if (!r) return true;
  return price >= r.min && price <= r.max;
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function getDiscountPercent(product) {
  if (Number(product?.discountPercent || 0) > 0) {
    return Number(product.discountPercent || 0);
  }
  const price = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || 0);
  if (!price || !originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function parseTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function isFlashSaleProduct(product, now) {
  const hasDiscount = getDiscountPercent(product) > 0;
  const stock = Number(product?.stock || 0);
  if (Boolean(product?.flashSaleActive)) {
    return hasDiscount && stock > 0;
  }
  if (!Boolean(product?.flashSale)) return false;
  const startAt = parseTime(product.flashSaleStartAt);
  const endAt = parseTime(product.flashSaleEndAt);
  const started = !startAt || startAt <= now;
  const notExpired = !endAt || endAt >= now;
  return hasDiscount && started && notExpired && stock > 0;
}

function formatCountdownParts(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

function applySort(list, sortKey) {
  const arr = [...list];
  switch (sortKey) {
    case "newest": return arr.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    case "discount": return arr.sort((a, b) =>
      (Number(b.originalPrice || 0) - Number(b.price || 0)) -
      (Number(a.originalPrice || 0) - Number(a.price || 0)));
    case "priceAsc": return arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    case "priceDesc": return arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    default: return arr.sort((a, b) => {
      if (Boolean(a.active) !== Boolean(b.active)) return Number(Boolean(b.active)) - Number(Boolean(a.active));
      return Number(b.price || 0) - Number(a.price || 0);
    });
  }
}

function getFlashSaleQuantity(product) {
  const stock = Number(product?.stock || 0);
  const quantity = Number(product?.flashSaleQuantity || 0);
  return quantity > 0 ? quantity : stock;
}

function getFlashSaleRemaining(product) {
  const quantity = getFlashSaleQuantity(product);
  const remaining = Number(product?.flashSaleRemaining);
  if (Number.isFinite(remaining)) {
    return Math.max(0, Math.min(quantity || remaining, remaining));
  }
  return quantity;
}

function formatTimelineTime(value, fallback) {
  const time = parseTime(value);
  if (!time) return fallback;
  return new Date(time).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function FlashSaleProduct({ product }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [cartAdded, setCartAdded] = useState(false);
  const price = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || 0);
  const discount = getDiscountPercent(product);
  const total = getFlashSaleQuantity(product);
  const remaining = getFlashSaleRemaining(product);
  const soldOut = remaining <= 0;
  const percent = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 100;
  const stock = Number(product?.stock || 0);
  const favorite = isFavorite(product.id);
  const category = product?.categoryName || "Sản phẩm";
  const saving = Math.max(0, originalPrice - price);

  const handleAddToCart = () => {
    if (soldOut || stock <= 0) return;
    addToCart(product, 1);
    setCartAdded(true);
    window.setTimeout(() => setCartAdded(false), 900);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product);
  };

  return (
    <article className={`tz-flash-item ${soldOut ? "sold-out" : ""}`}>
      {soldOut && (
        <div className="tz-flash-sold-layer">
          <span>Hết suất</span>
        </div>
      )}
      <div className="tz-flash-item-badges">
        <span>{category}</span>
        <strong>Flash sale</strong>
        {discount > 0 && <em>-{discount}%</em>}
      </div>
      <Link to={`/products/${product.id}`} className="tz-flash-item-link">
        <div className="tz-flash-img">
          <img
            src={getProductImageUrl(product)}
            alt={product.name}
            width="207"
            height="207"
            loading="lazy"
            onError={(event) => handleProductImageError(event, product)}
          />
        </div>
        <div className="tz-flash-meta">
          <span>{product.brand || "Apple"}</span>
          <b>Còn {remaining}</b>
        </div>
        <h3>{product.name}</h3>
        <strong className="tz-flash-price">
          {formatPrice(price)}
          {originalPrice > price && (
            <span className="tz-flash-price-line">
              <label>{formatPrice(originalPrice)}</label>
              {discount > 0 && <small>-{discount}%</small>}
            </span>
          )}
        </strong>
        {saving > 0 && <div className="tz-flash-saving">Tiết kiệm {formatPrice(saving)}</div>}
        <div className="tz-flash-remain">
          <span>Flash sale đang chạy</span>
          <span className="tz-flash-remain-bar">
            <i style={{ width: `${soldOut ? 0 : Math.max(8, percent)}%` }} />
            <b>Còn {remaining}/{total || remaining}</b>
          </span>
        </div>
      </Link>
      <div className="tz-flash-actions">
        <button type="button" className="tz-flash-cart-btn" onClick={handleAddToCart} disabled={soldOut || stock <= 0}>
          <span>{cartAdded ? <StoreCheckIcon /> : <StoreBagIcon />}</span>
          {soldOut || stock <= 0 ? "Hết suất" : cartAdded ? "Đã thêm" : "Thêm vào giỏ"}
        </button>
        <button type="button" className={`tz-flash-fav-btn ${favorite ? "active" : ""}`} onClick={handleToggleFavorite}>
          <span><StoreHeartIcon filled={favorite} /></span>
          {favorite ? "Đã thích" : "Yêu thích"}
        </button>
      </div>
    </article>
  );
}

function FlashSaleSection({ products, now, onShowAll }) {
  const scrollerRef = useRef(null);
  const activeEnds = products
    .map((product) => parseTime(product.flashSaleEndAt))
    .filter(Boolean)
    .sort((a, b) => a - b);
  const activeStarts = products
    .map((product) => parseTime(product.flashSaleStartAt))
    .filter(Boolean)
    .sort((a, b) => a - b);
  const endAt = activeEnds[0] || null;
  const startAt = activeStarts[0] || null;
  const [hours, minutes, seconds] = endAt
    ? formatCountdownParts(endAt - now)
    : ["--", "--", "--"];
  const timeline = `${formatTimelineTime(startAt, "09:00")} - ${formatTimelineTime(endAt, "23:59")}`;

  const scroll = (direction) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.min(760, node.clientWidth), behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section className="tz-flash-sale-section" id="flashsale" aria-label="Flash sale">
      <div className="tz-flash-stage"><span /></div>
      <div className="tz-flash-top">
        <div className="tz-flash-brand">
          <img src={flashSaleLogo} alt="Flash sale" className="tz-flash-logo-img" />
        </div>

        <div className="tz-flash-endtime" aria-label="Thời gian flash sale còn lại">
          <span>Kết thúc trong</span>
          <div className="tz-flash-countdown">
            <label>{hours}</label>
            <label>{minutes}</label>
            <label>{seconds}</label>
          </div>
        </div>

        <div className="tz-flash-timeline">
          <button type="button" className="active" onClick={onShowAll}>
            <span>Đang diễn ra</span>
            <span>{timeline}</span>
          </button>
        </div>
      </div>

      <div className="tz-flash-scroll-wrap">
        <button type="button" className="tz-flash-nav prev" onClick={() => scroll(-1)} aria-label="Sản phẩm trước">
          ‹
        </button>
        <div className="tz-flash-scroll" ref={scrollerRef}>
          {products.map((product) => <FlashSaleProduct key={product.id} product={product} />)}
        </div>
        <button type="button" className="tz-flash-nav next" onClick={() => scroll(1)} aria-label="Sản phẩm sau">
          ›
        </button>
      </div>
    </section>
  );
}

function BannerCarousel({ banners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((dir) => setIndex((p) => (p + dir + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const id = setInterval(() => go(1), 4500);
    return () => clearInterval(id);
  }, [paused, go, banners.length]);

  if (!banners.length) return null;
  return (
    <div className="tz-banner-root" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="tz-banner-frame">
        <div className="tz-banner-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {banners.map((b) => (
            <div className="tz-banner-slide" key={b.id}>
              <img src={b.imageUrl} alt={b.alt} loading="eager" />
            </div>
          ))}
        </div>
        <div className="tz-banner-progress">
          <div className="tz-banner-progress-bar" key={`${index}-${paused}`}
            style={{ animationPlayState: paused ? "paused" : "running" }} />
        </div>
        <button className="tz-banner-arrow left" onClick={() => go(-1)} aria-label="Trước" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button className="tz-banner-arrow right" onClick={() => go(1)} aria-label="Sau" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <div className="tz-banner-dots">
          {banners.map((b, i) => (
            <button key={b.id} className={`tz-banner-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)} aria-label={`Banner ${i + 1}`} type="button" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterBar({ chips, selectedCategory, onCategoryChange, sortKey, onSortChange, priceRange, onPriceRangeChange, keyword, onKeywordChange, count, total }) {
  const [open, setOpen] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const { addSearch } = useSearchHistory();
  const hasFilter = priceRange || sortKey !== "featured";
  const handleKeywordChange = (value) => {
    onKeywordChange(value);
    if (value.trim()) {
      addSearch(value);
    }
  };

  return (
    <div className="tz-filter-root">
      <div className="tz-chip-scroll">
        {chips.map((chip) => (
          <button key={chip.key} type="button"
            className={`tz-chip ${selectedCategory === chip.key ? "active" : ""}`}
            onClick={() => onCategoryChange(chip.key)}>
            <span className="tz-chip-icon">{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>

      <div className="tz-toolbar">
        <div className="tz-toolbar-left">
          <span className="tz-result-count">
            <span className="tz-result-num">{count}</span>
            {count !== total && <span className="tz-result-sep"> / {total}</span>}
            {" "}sản phẩm
          </span>
          <button type="button" className={`tz-filter-toggle ${open ? "active" : ""}`} onClick={() => setOpen((v) => !v)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
            </svg>
            Bộ lọc{hasFilter && <span className="tz-filter-dot" />}
          </button>
        </div>

        <div className="tz-search-wrap">
          <svg className="tz-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input id="site-search-input" className="tz-search-input"
            placeholder="Tìm tên, thương hiệu, danh mục..."
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onFocus={() => setShowSearchHistory(true)}
            onBlur={() => window.setTimeout(() => setShowSearchHistory(false), 160)} />
          {keyword && (
            <button type="button" className="tz-search-clear" onClick={() => onKeywordChange("")} aria-label="Xóa">×</button>
          )}
          <SearchHistoryDropdown
            visible={showSearchHistory && !keyword}
            onSelect={(query) => {
              handleKeywordChange(query);
              setShowSearchHistory(false);
            }}
          />
        </div>
      </div>

      {open && (
        <div className="tz-filter-panel">
          <div className="tz-filter-group">
            <span className="tz-filter-label">Sắp xếp</span>
            <div className="tz-pills">
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.key} type="button"
                  className={`tz-pill ${sortKey === opt.key ? "active" : ""}`}
                  onClick={() => onSortChange(opt.key)}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div className="tz-filter-sep" />
          <div className="tz-filter-group">
            <span className="tz-filter-label">Khoảng giá</span>
            <div className="tz-pills">
              {PRICE_RANGES.map((r) => (
                <button key={r.key} type="button"
                  className={`tz-pill ${priceRange === r.key ? "active" : ""}`}
                  onClick={() => onPriceRangeChange(r.key)}>{r.label}</button>
              ))}
            </div>
          </div>
          {hasFilter && (
            <button type="button" className="tz-filter-reset"
              onClick={() => { onSortChange("featured"); onPriceRangeChange(""); }}>
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("featured");
  const [priceRange, setPriceRange] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setKeyword((prev) => (prev !== q ? q : prev));
  }, [searchParams]);

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (current === keyword) return;
    const next = new URLSearchParams(searchParams);
    keyword ? next.set("q", keyword) : next.delete("q");
    next.delete("focus");
    setSearchParams(next, { replace: true });
  }, [keyword, searchParams, setSearchParams]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;
    const id = setTimeout(() => {
      if (focus === "1" || focus === "search") document.getElementById("site-search-input")?.focus();
      if (focus === "products") document.getElementById("product-section")?.scrollIntoView({ behavior: "smooth" });
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });
    }, 150);
    return () => clearTimeout(id);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    axiosClient.get("/products")
      .then((res) => setProducts(res.data || []))
      .catch(() => setError("Không tải được sản phẩm. Vui lòng chạy backend và MySQL."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const selectedCategory = searchParams.get("category") || "";

  const handleCategoryChange = useCallback((key) => {
    const next = new URLSearchParams(searchParams);
    key ? next.set("category", key) : next.delete("category");
    next.delete("focus");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

    const catalogProducts = useMemo(
    () => products.filter((p) => String(p.categoryName || "").toLowerCase() !== "banner"),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normKw = normalizeText(keyword);
    const list = catalogProducts.filter((p) => {
      if (!matchesCategory(p.categoryName || "", selectedCategory)) return false;
      if (!matchesPriceRange(Number(p.price || 0), priceRange)) return false;
      const text = normalizeText(`${p.name} ${p.brand} ${p.categoryName || ""}`);
      return !normKw || text.includes(normKw);
    });
    return applySort(list, sortKey);
  }, [catalogProducts, keyword, selectedCategory, sortKey, priceRange]);

  const flashSaleProducts = useMemo(() => {
    return catalogProducts
      .filter((product) => isFlashSaleProduct(product, now))
      .sort((a, b) => {
        const remainingDiff = Number(getFlashSaleRemaining(b) > 0) - Number(getFlashSaleRemaining(a) > 0);
        if (remainingDiff !== 0) return remainingDiff;
        const discountDiff = getDiscountPercent(b) - getDiscountPercent(a);
        if (discountDiff !== 0) return discountDiff;
        return Number(a.price || 0) - Number(b.price || 0);
      })
      .slice(0, 20);
  }, [catalogProducts, now]);

  const showFlashSaleProducts = useCallback(() => {
    setKeyword("");
    setPriceRange("");
    setSortKey("discount");
    handleCategoryChange("");
    window.setTimeout(() => {
      document.getElementById("product-section")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, [handleCategoryChange]);

  return (
    <div className="tz-home">
      <BannerCarousel banners={HOMEPAGE_BANNERS} />

      <div className="container">
        <div className="tz-policy-strip">
          {HOME_POLICIES.map((p) => (
            <div className="tz-policy-item" key={p.title}>
              <span className="tz-policy-icon">{p.icon}</span>
              <div className="tz-policy-body">
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && (
          <FlashSaleSection
            products={flashSaleProducts}
            now={now}
            onShowAll={showFlashSaleProducts}
          />
        )}

        <div className="tz-section-header" id="product-section">
          <p className="tz-section-kicker">Danh mục sản phẩm</p>
          <h2 className="tz-section-title">Chọn nhanh theo dòng Apple</h2>
        </div>

        <FilterBar
          chips={CATEGORY_CHIPS}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          sortKey={sortKey}
          onSortChange={setSortKey}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          keyword={keyword}
          onKeywordChange={setKeyword}
          count={filteredProducts.length}
          total={catalogProducts.length}
        />

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="tz-empty-state">
            <span className="tz-empty-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="tz-empty-state">
            <span className="tz-empty-icon">🔍</span>
            <p>Không tìm thấy sản phẩm phù hợp.</p>
            <button type="button" className="tz-empty-reset"
              onClick={() => { setKeyword(""); setPriceRange(""); setSortKey("featured"); handleCategoryChange(""); }}>
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
