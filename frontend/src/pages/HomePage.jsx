import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const seriesChips = [
    "iPhone 17 Series",
    "iPhone Air Series",
    "iPhone 16 Series",
    "iPhone 15 Series",
    "iPhone 14 Series",
    "iPhone 13 Series",
  ];

  const bannerItems = useMemo(() => {
    return products.filter((item) => item.category === "Banner");
  }, [products]);

  const fallbackBanners = [
    {
      id: "banner-fallback-1",
      name: "Banner iPhone 15 Plus",
      imageUrl: "/banners/0563809d876094fa2bb7606be2055307.png",
    },
    {
      id: "banner-fallback-2",
      name: "Banner iPhone 14",
      imageUrl: "/banners/38356f3a92241b0370c46bd784756025.png",
    },
    {
      id: "banner-fallback-3",
      name: "Banner iPad Air",
      imageUrl: "/banners/9a9b662b46b6c9bc3c4db6d4ebc6c2b8.jpg",
    },
    {
      id: "banner-fallback-4",
      name: "Banner MacBook Neo",
      imageUrl: "/banners/d0b16b549d82743e1793bef778366361.png",
    },
    {
      id: "banner-fallback-5",
      name: "Banner Apple Watch",
      imageUrl: "/banners/ee47b489951f3039bfad24e9840c66a8.png",
    },
    {
      id: "banner-fallback-6",
      name: "Banner iPhone 17e",
      imageUrl: "/banners/fafecfcac0d54395454c28fd5a6bcc84.jpg",
    },
  ];

  const catalogProducts = useMemo(() => {
    return products.filter((item) => item.category !== "Banner");
  }, [products]);

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
      phukien: ["phu kien", "phukien", "phu kien"],
    };
    const targets = groupMap[normalizedKey] || [normalizedKey];
    return targets.some((target) => normalizedItem.includes(normalizeText(target)));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosClient.get("/products");
        setProducts(res.data);
        setError("");
      } catch (error) {
        console.error(error);
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
    if (searchParams.get("focus") !== "1") return;
    const id = setTimeout(() => {
      const input = document.getElementById("site-search-input");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
    return () => clearTimeout(id);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const selectedCategory = searchParams.get("category") || "";
    return catalogProducts.filter((item) => {
      if (!matchesCategory(item.category, selectedCategory)) {
        return false;
      }
      const text = `${item.name} ${item.brand} ${item.category}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    });
  }, [catalogProducts, keyword, searchParams]);

  const banners = bannerItems.length > 0 ? bannerItems : fallbackBanners;

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const id = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(id);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length > 0) {
      setBannerIndex(0);
    }
  }, [banners.length]);

  const activeBanner = banners[bannerIndex];
  const handlePrev = () => {
    if (banners.length === 0) return;
    setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };
  const handleNext = () => {
    if (banners.length === 0) return;
    setBannerIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="page-gap">
      <section className="hero-stage">
        <div className="section-title">iPhone</div>
        <div className="banner-carousel">
          <button
            className="banner-arrow"
            type="button"
            aria-label="Trước"
            onClick={handlePrev}
            disabled={banners.length <= 1}
          >
            ←
          </button>
          <div className="banner-frame">
            {activeBanner ? (
              <img src={activeBanner.imageUrl} alt={activeBanner.name} />
            ) : (
              <div className="muted">Chưa có banner.</div>
            )}
          </div>
          <button
            className="banner-arrow"
            type="button"
            aria-label="Sau"
            onClick={handleNext}
            disabled={banners.length <= 1}
          >
            →
          </button>
        </div>
        {banners.length > 0 && (
          <div className="banner-dots">
            {banners.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`banner-dot ${index === bannerIndex ? "active" : ""}`}
                onClick={() => setBannerIndex(index)}
                aria-label={`Banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="chip-bar">
        <button className="chip" type="button">Lọc</button>
        {seriesChips.map((chip) => (
          <button className="chip" key={chip} type="button">{chip}</button>
        ))}
      </section>

      <section className="toolbar-row">
        <div className="sort-row">
          <span>Sắp xếp theo:</span>
          <div className="sort-options">
            {["Nổi bật", "Bán chạy", "Giảm giá", "Mới", "Giá"].map((label, idx) => (
              <button
                key={label}
                className={`sort-option ${idx === 0 ? "active" : ""}`}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="search-mini">
          <input
            className="input"
            placeholder="Tìm theo tên, thương hiệu, danh mục..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            id="site-search-input"
          />
        </div>
      </section>

      {loading ? (
        <div className="card p-lg">Đang tải sản phẩm...</div>
      ) : error ? (
        <div className="card p-lg">{error}</div>
      ) : (
        <section className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="card p-lg">Không tìm thấy sản phẩm phù hợp.</div>
          )}
        </section>
      )}

    </div>
  );
}
