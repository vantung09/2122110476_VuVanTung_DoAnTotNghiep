import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

const QUICK_PROMPTS = [
  "iPhone dưới 15 triệu còn hàng",
  "So sánh MacBook Air và iPad Pro",
  "Tai nghe nghe nhạc hay, có sale",
  "Flash sale hôm nay có gì?",
  "Combo phụ kiện cho iPhone",
  "Mua quà tặng dưới 3 triệu",
];

const STOP_WORDS = new Set([
  "toi", "minh", "ban", "can", "muon", "tim", "mua", "cho", "voi", "va", "la", "co", "nao", "cai", "con",
  "hang", "san", "pham", "gia", "tam", "khoang", "tu", "den", "duoi", "tren", "hon", "nhat", "nen", "chon",
]);

const NEED_PROFILES = [
  {
    label: "học tập, văn phòng",
    words: ["sinh vien", "hoc", "hoc tap", "van phong", "lam viec", "word", "excel", "thuyet trinh"],
    targets: ["mac", "macbook", "ipad", "laptop", "air"],
    reason: "phù hợp học tập/văn phòng",
  },
  {
    label: "chụp ảnh, quay video",
    words: ["chup anh", "camera", "quay", "video", "tiktok", "creator", "song ao", "anh dep"],
    targets: ["iphone", "pro", "camera", "promax", "pro max"],
    reason: "mạnh về camera",
  },
  {
    label: "nghe nhạc, âm thanh",
    words: ["nghe nhac", "am thanh", "tai nghe", "airpods", "loa", "bass", "chong on"],
    targets: ["airpods", "tai nghe", "earpods", "loa", "jbl", "marshall", "sony"],
    reason: "hợp nhu cầu âm thanh",
  },
  {
    label: "ghi chú, vẽ",
    words: ["ghi chu", "ve", "but", "pencil", "tablet", "may tinh bang", "designer"],
    targets: ["ipad", "pencil", "folio"],
    reason: "hợp ghi chú/vẽ",
  },
  {
    label: "phụ kiện, sạc",
    words: ["phu kien", "sac", "cap", "op lung", "mieng dan", "bao da", "adapter", "pin du phong"],
    targets: ["phu kien", "sac", "cap", "op lung", "mieng dan", "pencil", "anker", "bao da"],
    reason: "đúng nhóm phụ kiện",
  },
  {
    label: "sức khỏe, thể thao",
    words: ["suc khoe", "the thao", "dong ho", "watch", "tap luyen", "gps"],
    targets: ["watch", "apple watch", "ultra", "gps"],
    reason: "hợp theo dõi sức khỏe",
  },
  {
    label: "quà tặng",
    words: ["qua", "qua tang", "tang", "sinh nhat", "nguoi yeu", "bo me", "ban gai", "ban trai"],
    targets: ["airpods", "watch", "ipad", "loa", "phu kien", "iphone"],
    reason: "dễ làm quà tặng",
  },
];

const CATEGORY_HINTS = [
  { label: "iPhone", keys: ["iphone", "dien thoai", "phone"], targets: ["iphone"] },
  { label: "Mac", keys: ["mac", "macbook", "laptop"], targets: ["mac", "macbook"] },
  { label: "iPad", keys: ["ipad", "tablet", "may tinh bang"], targets: ["ipad"] },
  { label: "Watch", keys: ["watch", "dong ho"], targets: ["watch"] },
  { label: "Âm thanh", keys: ["airpods", "tai nghe", "loa", "am thanh"], targets: ["airpods", "tai nghe", "loa", "jbl", "sony", "marshall"] },
  { label: "Phụ kiện", keys: ["phu kien", "sac", "cap", "op lung", "mieng dan", "pencil", "bao da"], targets: ["phu kien", "sac", "cap", "op lung", "mieng dan", "pencil", "bao da"] },
];

const BRANDS = ["apple", "jbl", "sony", "marshall", "anker", "topzone", "jincase", "targus"];

function foldText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function normalizeText(value) {
  return foldText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function getProductCategory(product) {
  return product?.categoryName || product?.category || "";
}

function getProductText(product) {
  return normalizeText(`${product?.name || ""} ${product?.brand || ""} ${getProductCategory(product)} ${product?.description || ""}`);
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function parseMoneyValue(amount, unit) {
  const number = Number(String(amount || "0").replace(",", "."));
  if (!Number.isFinite(number)) return null;
  const normalizedUnit = normalizeText(unit);
  if (["k", "nghin", "ngan"].includes(normalizedUnit)) return number * 1_000;
  if (["tr", "trieu", "cu"].includes(normalizedUnit)) return number * 1_000_000;
  if (number < 1_000 && normalizedUnit !== "vnd" && normalizedUnit !== "d") return number * 1_000_000;
  return number;
}

function detectBudget(message) {
  const raw = foldText(message).replace(/,/g, ".");
  const rangeMatch = raw.match(/(?:tu|khoang)?\s*(\d+(?:\.\d+)?)\s*(trieu|tr|cu|k|nghin|ngan)?\s*(?:den|toi|-)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|cu|k|nghin|ngan)?/i);
  if (rangeMatch) {
    const min = parseMoneyValue(rangeMatch[1], rangeMatch[2] || rangeMatch[4] || "trieu");
    const max = parseMoneyValue(rangeMatch[3], rangeMatch[4] || rangeMatch[2] || "trieu");
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }

  const moneyMatch = raw.match(/(\d+(?:\.\d+)?)\s*(trieu|tr|cu|k|nghin|ngan|vnd|d)?/i);
  if (!moneyMatch) return null;

  const amount = parseMoneyValue(moneyMatch[1], moneyMatch[2] || "trieu");
  if (!amount) return null;
  const text = normalizeText(message);

  if (text.includes("duoi") || text.includes("toi da") || text.includes("max") || text.includes("nho hon")) {
    return { max: amount };
  }
  if (text.includes("tren") || text.includes("hon") || text.includes("tu ")) {
    return { min: amount };
  }
  return { max: amount };
}

function getDiscountPercent(product) {
  const price = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || 0);
  if (!price || !originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function getSaving(product) {
  const price = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || 0);
  return originalPrice > price ? originalPrice - price : 0;
}

function detectIntent(message) {
  const text = normalizeText(message);
  return {
    compare: includesAny(text, ["so sanh", "khac nhau", "nen chon", "chon cai nao", "hon gi"]),
    cheapest: includesAny(text, ["re nhat", "gia re", "mem nhat", "tiet kiem"]),
    premium: includesAny(text, ["cao cap", "manh nhat", "tot nhat", "pro", "flagship", "xịn", "xin"]),
    sale: includesAny(text, ["sale", "flash sale", "flashsale", "giam", "khuyen mai", "uu dai", "giam gia"]),
    stock: includesAny(text, ["con hang", "san hang", "co san", "lay ngay"]),
    gift: includesAny(text, ["qua", "qua tang", "tang", "sinh nhat"]),
    accessory: includesAny(text, ["combo", "phu kien", "sac", "cap", "op lung", "mieng dan"]),
  };
}

function getMatchedNeeds(message) {
  const text = normalizeText(message);
  return NEED_PROFILES.filter((profile) => includesAny(text, profile.words));
}

function getMatchedCategories(message) {
  const text = normalizeText(message);
  return CATEGORY_HINTS.filter((category) => includesAny(text, category.keys));
}

function getMatchedBrand(message) {
  const text = normalizeText(message);
  return BRANDS.find((brand) => text.includes(brand));
}

function scoreProduct(product, message) {
  const text = normalizeText(message);
  const tokens = tokenize(message);
  const haystack = getProductText(product);
  const budget = detectBudget(message);
  const needs = getMatchedNeeds(message);
  const categories = getMatchedCategories(message);
  const brand = getMatchedBrand(message);
  const intent = detectIntent(message);
  const price = Number(product?.price || 0);
  const stock = Number(product?.stock || 0);
  const discount = getDiscountPercent(product);
  const flashSaleActive = Boolean(product?.flashSaleActive);
  let score = 0;

  categories.forEach((category) => {
    if (category.targets.some((target) => haystack.includes(target))) score += 18;
  });

  needs.forEach((profile) => {
    if (profile.targets.some((target) => haystack.includes(target))) score += 12;
  });

  tokens.forEach((word) => {
    if (haystack.includes(word)) score += word.length >= 5 ? 4 : 2;
  });

  if (brand && haystack.includes(brand)) score += 10;
  if (budget?.max && price <= budget.max) score += 12;
  if (budget?.max && price > budget.max) score -= Math.min(18, Math.ceil((price - budget.max) / 1_000_000) * 2);
  if (budget?.min && price >= budget.min) score += 8;
  if (budget?.min && price < budget.min) score -= 6;

  if (intent.sale) score += discount > 0 ? 12 + Math.min(discount, 20) / 2 : -4;
  if (intent.sale && flashSaleActive) score += 14;
  if (intent.stock) score += stock > 0 ? 10 : -14;
  if (intent.cheapest) score += Math.max(0, 12 - Math.floor(price / 5_000_000));
  if (intent.premium) score += /pro|max|ultra|m5|m4|512|1tb/i.test(product?.name || "") ? 10 : 0;
  if (intent.accessory) score += /sạc|sac|cáp|cap|ốp|op|pencil|bao da|adapter|pin/i.test(`${product?.name} ${getProductCategory(product)}`) ? 10 : -2;

  if (stock > 0) score += 4;
  if (discount > 0) score += 3;
  if (normalizeText(getProductCategory(product)) === "banner") score -= 100;

  if (!text && stock > 0) score += 1;
  return score;
}

function buildReasons(product, message) {
  const reasons = [];
  const budget = detectBudget(message);
  const needs = getMatchedNeeds(message);
  const discount = getDiscountPercent(product);
  const saving = getSaving(product);
  const price = Number(product?.price || 0);
  const stock = Number(product?.stock || 0);
  const flashSaleActive = Boolean(product?.flashSaleActive);

  if (budget?.max && price <= budget.max) reasons.push(`nằm trong ngân sách ${formatPrice(budget.max)}`);
  if (budget?.min && price >= budget.min) reasons.push(`đúng khoảng từ ${formatPrice(budget.min)}`);
  if (needs[0]) reasons.push(needs[0].reason);
  if (stock > 0) reasons.push(stock <= 5 ? `còn ${stock} máy` : "còn hàng");
  if (flashSaleActive) reasons.push("đang trong flash sale");
  if (discount > 0) reasons.push(`giảm ${discount}%, tiết kiệm ${formatPrice(saving)}`);
  if (!reasons.length && product?.brand) reasons.push(`thuộc thương hiệu ${product.brand}`);

  return reasons.slice(0, 4);
}

function visibleCatalog(products) {
  return products.filter((product) => normalizeText(getProductCategory(product)) !== "banner" && product?.active !== false);
}

function summarizeCatalog(products) {
  const catalog = visibleCatalog(products);
  const available = catalog.filter((product) => Number(product.stock || 0) > 0).length;
  const sale = catalog.filter((product) => getDiscountPercent(product) > 0).length;
  return `Mình đã đọc ${catalog.length} sản phẩm TungZone, trong đó ${available} sản phẩm còn hàng và ${sale} sản phẩm đang có giá tốt.`;
}

function rankProducts(message, products, limit = 5) {
  return visibleCatalog(products)
    .map((product) => ({ product, score: scoreProduct(product, message) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || getDiscountPercent(b.product) - getDiscountPercent(a.product) || Number(a.product.price || 0) - Number(b.product.price || 0))
    .slice(0, limit)
    .map(({ product }) => ({
      ...product,
      assistantReasons: buildReasons(product, message),
    }));
}

function getBestDeals(products, limit = 4) {
  return visibleCatalog(products)
    .filter((product) => Number(product.stock || 0) > 0)
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a) || getSaving(b) - getSaving(a))
    .slice(0, limit);
}

function getAffordableProducts(products, limit = 4) {
  return visibleCatalog(products)
    .filter((product) => Number(product.stock || 0) > 0)
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    .slice(0, limit);
}

function buildComparisonText(products) {
  const lines = products.slice(0, 3).map((product, index) => {
    const discount = getDiscountPercent(product);
    const stock = Number(product.stock || 0);
    const stockText = stock > 0 ? `còn ${stock}` : "hết hàng";
    const discountText = discount > 0 ? `, giảm ${discount}%` : "";
    return `${index + 1}. ${product.name}: ${formatPrice(product.price)} (${stockText}${discountText})`;
  });
  return `Mình so sánh nhanh các lựa chọn nổi bật:\n${lines.join("\n")}\n\nNếu ưu tiên giá, chọn mẫu rẻ nhất còn hàng. Nếu ưu tiên dùng lâu và hiệu năng/camera, chọn mẫu Pro hoặc cấu hình cao hơn.`;
}

function buildReply(message, products, previousProducts = []) {
  if (!products.length) {
    return {
      text: "Mình chưa tải được danh sách sản phẩm. Bạn bật backend rồi thử lại nhé.",
      products: [],
      followups: ["Tải lại sản phẩm", "iPhone còn hàng", "Sản phẩm đang sale"],
    };
  }

  const normalizedMessage = normalizeText(message);
  const intent = detectIntent(message);

  if (!normalizedMessage || includesAny(normalizedMessage, ["xin chao", "hello", "hi", "tu van", "giup minh"])) {
    const deals = getBestDeals(products, 3);
    return {
      text: `${summarizeCatalog(products)} Bạn nói ngân sách, nhu cầu hoặc dòng máy, mình sẽ lọc và giải thích nên chọn mẫu nào.`,
      products: deals,
      followups: ["iPhone dưới 15 triệu", "MacBook cho sinh viên", "Tai nghe đang sale"],
    };
  }

  if (intent.compare && previousProducts.length >= 2 && tokenize(message).length <= 4) {
    return {
      text: buildComparisonText(previousProducts),
      products: previousProducts.slice(0, 3),
      followups: ["Chọn mẫu rẻ hơn", "Ưu tiên hiệu năng", "Ưu tiên còn hàng"],
    };
  }

  let matches = rankProducts(message, products, 5);

  if (!matches.length && intent.sale) matches = getBestDeals(products, 4);
  if (!matches.length && intent.cheapest) matches = getAffordableProducts(products, 4);
  if (!matches.length && previousProducts.length) matches = previousProducts.slice(0, 4);

  if (!matches.length) {
    const fallback = getAffordableProducts(products, 3);
    return {
      text: "Mình chưa thấy sản phẩm khớp thật rõ. Bạn thử nói thêm dòng máy, ngân sách hoặc nhu cầu chính nhé. Tạm thời đây là vài mẫu còn hàng giá dễ tiếp cận.",
      products: fallback,
      followups: ["Dưới 10 triệu", "Chụp ảnh đẹp", "Phụ kiện cần thiết"],
    };
  }

  const budget = detectBudget(message);
  const need = getMatchedNeeds(message)[0]?.label;
  const category = getMatchedCategories(message)[0]?.label;
  const budgetText = budget?.max ? ` trong mức tối đa ${formatPrice(budget.max)}` : budget?.min ? ` từ ${formatPrice(budget.min)} trở lên` : "";
  const scopeText = [category, need].filter(Boolean).join(", ");

  if (intent.compare && matches.length >= 2) {
    return {
      text: buildComparisonText(matches),
      products: matches.slice(0, 3),
      followups: ["Mẫu nào đáng tiền nhất?", "Chọn theo pin", "Chọn theo camera"],
    };
  }

  return {
    text: `Mình đề xuất ${matches.length} lựa chọn${budgetText}${scopeText ? ` cho ${scopeText}` : ""}. Mình ưu tiên sản phẩm còn hàng, đúng nhu cầu và có giá tốt trước.`,
    products: matches,
    followups: ["So sánh các mẫu này", "Chọn mẫu đáng tiền nhất", "Tìm rẻ hơn"],
  };
}

export default function ProductAssistant() {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [message, setMessage] = useState("");
  const messageListRef = useRef(null);
  const [conversation, setConversation] = useState([
    {
      role: "assistant",
      text: "Chào bạn, mình là AI tư vấn TungZone. Mình có thể lọc sản phẩm theo ngân sách, nhu cầu, tồn kho, sale và so sánh nhanh để bạn chọn dễ hơn.",
      products: [],
      followups: ["iPhone dưới 15 triệu", "MacBook cho sinh viên", "Tai nghe đang sale"],
    },
  ]);

  useEffect(() => {
    if (!open || products.length || loadingProducts) return;
    setLoadingProducts(true);
    axiosClient.get("/products")
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [open, products.length, loadingProducts]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [conversation, open]);

  const suggestedProducts = useMemo(() => getBestDeals(products, 3), [products]);

  const lastAssistantProducts = useMemo(() => {
    const previous = [...conversation].reverse().find((item) => item.role === "assistant" && item.products?.length);
    return previous?.products || [];
  }, [conversation]);

  const submitMessage = (value = message) => {
    const cleanMessage = value.trim();
    if (!cleanMessage) return;
    const reply = loadingProducts
      ? { text: "Mình đang tải dữ liệu sản phẩm, chờ một chút rồi hỏi lại nhé.", products: [] }
      : buildReply(cleanMessage, products, lastAssistantProducts);

    setConversation((prev) => [
      ...prev,
      { role: "user", text: cleanMessage, products: [] },
      { role: "assistant", ...reply },
    ]);
    setMessage("");
  };

  const resetConversation = () => {
    setConversation([
      {
        role: "assistant",
        text: "Mình đã làm mới cuộc trò chuyện. Bạn muốn tìm sản phẩm theo giá, nhu cầu, thương hiệu hay danh mục nào?",
        products: [],
        followups: ["Mua quà dưới 3 triệu", "iPad để học", "Combo phụ kiện iPhone"],
      },
    ]);
  };

  const handleAddToCart = (product) => {
    if (Number(product.stock || 0) <= 0) return;
    addToCart(product, 1);
    setConversation((prev) => [
      ...prev,
      { role: "assistant", text: `Đã thêm ${product.name} vào giỏ hàng.`, products: [] },
    ]);
  };

  const renderProducts = (items) => (
    <div className="tz-assistant-products">
      {items.map((product) => {
        const discount = getDiscountPercent(product);
        const stock = Number(product.stock || 0);
        const favorite = isFavorite(product.id);
        return (
          <article className="tz-assistant-product" key={product.id}>
            <Link className="tz-assistant-product-main" to={`/products/${product.id}`}>
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                onError={(event) => handleProductImageError(event, product)}
              />
              <span>
                <strong>{product.name}</strong>
                <small>{formatPrice(product.price)}</small>
                <em>
                  {stock > 0 ? `Còn ${stock}` : "Hết hàng"}
                  {discount > 0 ? ` · Giảm ${discount}%` : ""}
                </em>
                {product.assistantReasons?.length ? (
                  <b>{product.assistantReasons.join(" · ")}</b>
                ) : null}
              </span>
            </Link>
            <div className="tz-assistant-product-actions">
              <button type="button" onClick={() => handleAddToCart(product)} disabled={stock <= 0}>
                {stock <= 0 ? "Hết hàng" : "Thêm giỏ"}
              </button>
              <button type="button" className={favorite ? "active" : ""} onClick={() => toggleFavorite(product)}>
                {favorite ? "Đã thích" : "Yêu thích"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <div className={`tz-assistant ${open ? "open" : ""}`}>
      {open ? (
        <section className="tz-assistant-panel" aria-label="Trợ lý tư vấn sản phẩm">
          <header className="tz-assistant-header">
            <div>
              <strong>AI tư vấn TungZone</strong>
              <span>{loadingProducts ? "Đang đọc catalog..." : "Hiểu ngân sách, nhu cầu, tồn kho và sale"}</span>
            </div>
            <div className="tz-assistant-header-actions">
              <button type="button" onClick={resetConversation} aria-label="Làm mới hội thoại">
                ↻
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý">
                ×
              </button>
            </div>
          </header>

          <div className="tz-assistant-messages" ref={messageListRef}>
            {conversation.map((item, index) => (
              <div className={`tz-assistant-message ${item.role}`} key={`${item.role}-${index}`}>
                <p>{item.text}</p>
                {item.products?.length ? renderProducts(item.products) : null}
                {item.followups?.length ? (
                  <div className="tz-assistant-followups">
                    {item.followups.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => submitMessage(prompt)}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {conversation.length === 1 && suggestedProducts.length ? (
              <div className="tz-assistant-message assistant">
                <p>Một vài sản phẩm đáng chú ý đang còn hàng:</p>
                {renderProducts(suggestedProducts)}
              </div>
            ) : null}
          </div>

          <div className="tz-assistant-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => submitMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="tz-assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage();
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ví dụ: so sánh iPhone 15 và 16 dưới 20 triệu..."
            />
            <button type="submit">Gửi</button>
          </form>
        </section>
      ) : null}

      <button className="tz-assistant-toggle" type="button" onClick={() => setOpen((prev) => !prev)}>
        <span>AI</span>
        <strong>Tư vấn</strong>
      </button>
    </div>
  );
}
