import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import ProductCard from "../components/ProductCard";

const CATEGORY_CHIPS = [
  { key: "", label: "Tất cả" },
  { key: "iphone", label: "iPhone" },
  { key: "mac", label: "Mac" },
  { key: "ipad", label: "iPad" },
  { key: "watch", label: "Watch" },
  { key: "tainghe", label: "Tai nghe, Loa" },
  { key: "phukien", label: "Phụ kiện" },
];

const SORT_OPTIONS = [
  { key: "featured", label: "Nổi bật" },
  { key: "newest", label: "Mới cập nhật" },
  { key: "discount", label: "Giảm giá tốt" },
  { key: "priceAsc", label: "Giá thấp đến cao" },
  { key: "priceDesc", label: "Giá cao đến thấp" },
];

const HOMEPAGE_BANNERS = [
  { id: "banner-home-1", name: "Banner TungZone 1", imageUrl: "/banners/0563809d876094fa2bb7606be2055307.png" },
  { id: "banner-home-2", name: "Banner TungZone 2", imageUrl: "/banners/38356f3a92241b0370c46bd784756025.png" },
  { id: "banner-home-3", name: "Banner TungZone 3", imageUrl: "/banners/9a9b662b46b6c9bc3c4db6d4ebc6c2b8.jpg" },
  { id: "banner-home-4", name: "Banner TungZone 4", imageUrl: "/banners/d0b16b549d82743e1793bef778366361.png" },
  { id: "banner-home-5", name: "Banner TungZone 5", imageUrl: "/banners/ee47b489951f3039bfad24e9840c66a8.png" },
  { id: "banner-home-6", name: "Banner TungZone 6", imageUrl: "/banners/fafecfcac0d54395454c28fd5a6bcc84.jpg" },
];

const HOME_POLICIES = [
  { title: "Mẫu mã đa dạng", desc: "Apple chính hãng, nhiều lựa chọn cho từng nhu cầu." },
  { title: "Giao hàng toàn quốc", desc: "Nhận hàng nhanh và theo dõi đơn thuận tiện." },
  { title: "Bảo hành rõ ràng", desc: "Hỗ trợ kỹ thuật và tiếp nhận bảo hành tại hệ thống." },
  { title: "Đổi trả thuận tiện", desc: "Yên tâm mua sắm với chính sách hỗ trợ minh bạch." },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [sortKey, setSortKey] = useState("featured");
  const [searchParams, setSearchParams] = useSearchParams();

  const catalogProducts = useMemo(
    () => products.filter((item) => String(item.category || "").toLowerCase() !== "banner"),
    [products]
  );

  const normalizeText = (value) => {
    if (!value) return "";

    return value
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  };

  const matchesCategory = (itemCategory, selectedKey) => {
    const normalizedKey = normalizeText(selectedKey);
    if (!normalizedKey) return true;

    const normalizedItem = normalizeText(itemCategory);
    const groupMap = {
      iphone: ["iphone"],
      mac: ["mac"],
      ipad: ["ipad"],
      watch: ["watch"],
      tainghe: ["tai nghe", "am thanh", "loa"],
      phukien: ["phu kien", "phukien"],
    };

    const targets = groupMap[normalizedKey] || [normalizedKey];
    return targets.some((target) => normalizedItem.includes(normalizeText(target)));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosClient.get("/products");
        setProducts(res.data || []);
        setError("");
      } catch (fetchError) {
        console.error(fetchError);
        setError("Không tải được sản phẩm. Vui lòng chạy backend và MySQL.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const query = searchParams.get("q") || "";
    setKeyword((prev) => (prev === query ? prev : query));
  }, [searchParams]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") || "";
    if (currentQuery === keyword) return;

    const nextParams = new URLSearchParams(searchParams);
    if (keyword) {
      nextParams.set("q", keyword);
    } else {
      nextParams.delete("q");
    }

    nextParams.delete("focus");
    setSearchParams(nextParams, { replace: true });
  }, [keyword, searchParams, setSearchParams]);

  useEffect(() => {
    const focusTarget = searchParams.get("focus");
    if (!focusTarget) return;

    const id = setTimeout(() => {
      if (focusTarget === "1" || focusTarget === "search") {
        const input = document.getElementById("site-search-input");
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      if (focusTarget === "products") {
        const productSection = document.getElementById("storefront-product-section");
        productSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("focus");
      setSearchParams(nextParams, { replace: true });
    }, 150);

    return () => clearTimeout(id);
  }, [searchParams, setSearchParams]);

  const selectedCategory = searchParams.get("category") || "";

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    const list = catalogProducts.filter((item) => {
      if (!matchesCategory(item.category, selectedCategory)) {
        return false;
      }

      const text = normalizeText(`${item.name} ${item.brand} ${item.category}`);
      return !normalizedKeyword || text.includes(normalizedKeyword);
    });

    switch (sortKey) {
      case "newest":
        return [...list].sort((left, right) => Number(right.id || 0) - Number(left.id || 0));
      case "discount":
        return [...list].sort((left, right) => {
          const leftDiscount = Number(left.originalPrice || 0) - Number(left.price || 0);
          const rightDiscount = Number(right.originalPrice || 0) - Number(right.price || 0);
          return rightDiscount - leftDiscount;
        });
      case "priceAsc":
        return [...list].sort((left, right) => Number(left.price || 0) - Number(right.price || 0));
      case "priceDesc":
        return [...list].sort((left, right) => Number(right.price || 0) - Number(left.price || 0));
      case "featured":
      default:
        return [...list].sort((left, right) => {
          if (Boolean(left.active) !== Boolean(right.active)) {
            return Number(Boolean(right.active)) - Number(Boolean(left.active));
          }
          return Number(right.price || 0) - Number(left.price || 0);
        });
    }
  }, [catalogProducts, keyword, selectedCategory, sortKey]);

  useEffect(() => {
    if (HOMEPAGE_BANNERS.length <= 1) return undefined;

    const id = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % HOMEPAGE_BANNERS.length);
    }, 4500);

    return () => clearInterval(id);
  }, []);

  const handlePrev = () => {
    if (HOMEPAGE_BANNERS.length === 0) return;
    setBannerIndex((prev) => (prev - 1 + HOMEPAGE_BANNERS.length) % HOMEPAGE_BANNERS.length);
  };

  const handleNext = () => {
    if (HOMEPAGE_BANNERS.length === 0) return;
    setBannerIndex((prev) => (prev + 1) % HOMEPAGE_BANNERS.length);
  };

  const handleCategoryChipClick = (key) => {
    const nextParams = new URLSearchParams(searchParams);

    if (key) {
      nextParams.set("category", key);
    } else {
      nextParams.delete("category");
    }

    nextParams.delete("focus");
    setSearchParams(nextParams);
  };

  const selectedCategoryLabel =
    CATEGORY_CHIPS.find((chip) => chip.key === selectedCategory)?.label || "Tất cả";
  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.key === sortKey)?.label || SORT_OPTIONS[0].label;

  return (
    <div className="page-gap storefront-page">
      <section className="hero-stage">
        <div className="banner-carousel">
          <div className="banner-frame">
            {HOMEPAGE_BANNERS.length > 0 ? (
              <>
                <div className="banner-track" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
                  {HOMEPAGE_BANNERS.map((item) => (
                    <div className="banner-slide" key={item.id}>
                      <img src={item.imageUrl} alt={item.name} />
                    </div>
                  ))}
                </div>

                <button
                  className="banner-arrow banner-arrow-left"
                  type="button"
                  aria-label="Trước"
                  onClick={handlePrev}
                  disabled={HOMEPAGE_BANNERS.length <= 1}
                >
                  ‹
                </button>

                <button
                  className="banner-arrow banner-arrow-right"
                  type="button"
                  aria-label="Sau"
                  onClick={handleNext}
                  disabled={HOMEPAGE_BANNERS.length <= 1}
                >
                  ›
                </button>

                <div className="banner-dots">
                  {HOMEPAGE_BANNERS.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`banner-dot ${index === bannerIndex ? "active" : ""}`}
                      onClick={() => setBannerIndex(index)}
                      aria-label={`Banner ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="muted">Chưa có banner.</div>
            )}
          </div>
        </div>
      </section>

      <section className="home-policy-strip">
        <div className="home-policy-grid">
          {HOME_POLICIES.map((policy, index) => (
            <article key={policy.title} className="home-policy-item">
              <span className="home-policy-icon" aria-hidden="true">{index + 1}</span>
              <h3>{policy.title}</h3>
              <p>{policy.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="storefront-section-panel storefront-product-section" id="storefront-product-section">
        <div className="storefront-heading-row">
          <div>
            <h2 className="storefront-panel-title">Chọn nhanh theo dòng sản phẩm Apple</h2>
          </div>
          <span className="storefront-count-badge">{filteredProducts.length} sản phẩm</span>
        </div>

        <div className="chip-bar">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              className={`chip ${selectedCategory === chip.key ? "active" : ""}`}
              key={chip.label}
              type="button"
              onClick={() => handleCategoryChipClick(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="toolbar-row">
          <div className="sort-row">
            <span>Sắp xếp theo:</span>
            <div className="sort-options">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  className={`sort-option ${sortKey === option.key ? "active" : ""}`}
                  type="button"
                  onClick={() => setSortKey(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-mini">
            <input
              className="input"
              placeholder="Tìm theo tên, thương hiệu, danh mục..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              id="site-search-input"
            />
          </div>
        </div>

        <div className="toolbar-summary">
          <span className="toolbar-pill">Danh mục: {selectedCategoryLabel}</span>
          <span className="toolbar-pill">Sắp xếp: {selectedSortLabel}</span>
        </div>

        {loading ? (
          <div className="storefront-empty">Đang tải sản phẩm...</div>
        ) : error ? (
          <div className="storefront-empty">{error}</div>
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="storefront-empty">Không tìm thấy sản phẩm phù hợp.</div>
        )}
      </section>
    </div>
  );
}
