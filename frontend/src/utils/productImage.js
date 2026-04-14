import { BACKEND_BASE_URL } from "../config/appConfig";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const SPECIAL_URL_PATTERN = /^(data|blob):/i;

const CATEGORY_FALLBACKS = {
  iphone: `${BACKEND_BASE_URL}/images/iphone-16-pro-den-650x650.png`,
  mac: `${BACKEND_BASE_URL}/images/hinhanh/macbook-air-13-inch-m4-thumb-xanh-den-650x650.png`,
  ipad: `${BACKEND_BASE_URL}/images/hinhanh/ipad-air-m3-11-inch-wifi-gray-thumb-650x650.png`,
  watch: `${BACKEND_BASE_URL}/images/hinhanh/apple-watch-series-10-lte-42mm-day-vai-den-tb-650x650.png`,
  "tai nghe": `${BACKEND_BASE_URL}/images/hinhanh/airpods-4-thumb-650x650.png`,
  loa: `${BACKEND_BASE_URL}/images/hinhanh/loa-bluetooth-jbl-clip-5-thumb-650x650.png`,
  "phu kien": `${BACKEND_BASE_URL}/images/hinhanh/apple-pencil-pro-650x650.png`,
  "phụ kiện": `${BACKEND_BASE_URL}/images/hinhanh/apple-pencil-pro-650x650.png`,
  banner: "/banners/0563809d876094fa2bb7606be2055307.png",
};

const NAME_FALLBACKS = [
  { pattern: /macbook air|mac air|macbook/i, url: CATEGORY_FALLBACKS.mac },
  { pattern: /ipad/i, url: CATEGORY_FALLBACKS.ipad },
  { pattern: /watch/i, url: CATEGORY_FALLBACKS.watch },
  { pattern: /airpods|tai nghe|earpods/i, url: CATEGORY_FALLBACKS["tai nghe"] },
  { pattern: /loa/i, url: CATEGORY_FALLBACKS.loa },
  { pattern: /op lung|mieng dan|sac|cap|pencil|bao da|phu kien/i, url: CATEGORY_FALLBACKS["phu kien"] },
  { pattern: /iphone/i, url: CATEGORY_FALLBACKS.iphone },
];

export function getFallbackImage(product) {
  const category = String(product?.category || "").toLowerCase();
  const name = String(product?.name || "").toLowerCase();

  const categoryMatch = Object.entries(CATEGORY_FALLBACKS).find(([key]) =>
    category.includes(key)
  );
  if (categoryMatch) {
    return categoryMatch[1];
  }

  const nameMatch = NAME_FALLBACKS.find((item) => item.pattern.test(name));
  if (nameMatch) {
    return nameMatch.url;
  }

  return `${BACKEND_BASE_URL}/images/iphone-15-green-1-2-650x650.png`;
}

export function resolveProductImageUrl(rawImageUrl) {
  const imageUrl = String(rawImageUrl || "").trim();
  if (!imageUrl) return "";

  if (ABSOLUTE_URL_PATTERN.test(imageUrl) || SPECIAL_URL_PATTERN.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/banners/") || imageUrl.startsWith("/icons/")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }

  return `${BACKEND_BASE_URL}/${imageUrl.replace(/^\.?\//, "")}`;
}

export function getProductImageUrl(product) {
  const resolvedUrl = resolveProductImageUrl(product?.imageUrl);
  if (resolvedUrl) {
    return resolvedUrl;
  }
  return getFallbackImage(product);
}

export function handleProductImageError(event, product) {
  const fallbackUrl = getFallbackImage(product);
  if (event.currentTarget.dataset.fallbackApplied === "true") return;
  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = fallbackUrl;
}
