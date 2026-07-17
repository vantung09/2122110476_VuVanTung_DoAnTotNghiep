import { BACKEND_BASE_URL } from "../config/appConfig";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const SPECIAL_URL_PATTERN = /^(data|blob):/i;
const LOCAL_IMAGE_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const PUBLIC_BASE_URL = import.meta.env.BASE_URL || "/";

export function resolvePublicAsset(path) {
  return `${PUBLIC_BASE_URL}${String(path || "").replace(/^\/+/, "")}`;
}

function resolveBackendAsset(path) {
  return BACKEND_BASE_URL ? `${BACKEND_BASE_URL}${path}` : resolvePublicAsset(path);
}

const CATEGORY_FALLBACKS = {
  iphone: resolveBackendAsset("/images/iphone-16-pro-den-650x650.png"),
  mac: resolveBackendAsset("/images/hinhanh/macbook-air-13-inch-m4-thumb-xanh-den-650x650.png"),
  ipad: resolveBackendAsset("/images/hinhanh/ipad-air-m3-11-inch-wifi-gray-thumb-650x650.png"),
  watch: resolveBackendAsset("/images/hinhanh/apple-watch-series-10-lte-42mm-day-vai-den-tb-650x650.png"),
  "tai nghe": resolveBackendAsset("/images/hinhanh/airpods-4-thumb-650x650.png"),
  loa: resolveBackendAsset("/images/hinhanh/loa-bluetooth-jbl-clip-5-thumb-650x650.png"),
  "phu kien": resolveBackendAsset("/images/hinhanh/apple-pencil-pro-650x650.png"),
  banner: resolvePublicAsset("/banners/0563809d876094fa2bb7606be2055307.png"),
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

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d");
}

export function getFallbackImage(product) {
  const category = normalizeText(product?.categoryName || product?.category);
  const name = normalizeText(product?.name);

  const categoryMatch = Object.entries(CATEGORY_FALLBACKS).find(([key]) =>
    category.includes(normalizeText(key))
  );
  if (categoryMatch) {
    return categoryMatch[1];
  }

  const nameMatch = NAME_FALLBACKS.find((item) => item.pattern.test(name));
  if (nameMatch) {
    return nameMatch.url;
  }

  return resolveBackendAsset("/images/iphone-15-green-1-2-650x650.png");
}

function resolveAbsoluteImageUrl(imageUrl) {
  if (SPECIAL_URL_PATTERN.test(imageUrl)) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    if (LOCAL_IMAGE_HOSTS.has(url.hostname) && url.pathname.startsWith("/images/")) {
      return resolveBackendAsset(`${url.pathname}${url.search}${url.hash}`);
    }
  } catch {
    return imageUrl;
  }

  return imageUrl;
}

export function resolveProductImageUrl(rawImageUrl) {
  const imageUrl = String(rawImageUrl || "").trim();
  if (!imageUrl) return "";

  if (ABSOLUTE_URL_PATTERN.test(imageUrl) || SPECIAL_URL_PATTERN.test(imageUrl)) {
    return resolveAbsoluteImageUrl(imageUrl);
  }

  if (imageUrl.startsWith("/banners/") || imageUrl.startsWith("/icons/")) {
    return resolvePublicAsset(imageUrl);
  }

  if (imageUrl.startsWith("/")) {
    return resolveBackendAsset(imageUrl);
  }

  return resolveBackendAsset(`/${imageUrl.replace(/^\.?\//, "")}`);
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
