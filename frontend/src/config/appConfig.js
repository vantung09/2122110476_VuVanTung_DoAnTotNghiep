const DEFAULT_API_HOST = "http://localhost:8085";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const readConfiguredUrl = (value) => {
  const normalized = trimTrailingSlash(value);
  if (!normalized || normalized.includes("your-backend-domain")) {
    return "";
  }
  if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(normalized)) {
    return "";
  }
  return normalized;
};

const configuredBackendHost = readConfiguredUrl(import.meta.env.VITE_BACKEND_BASE_URL);
const configuredApiBaseUrl = readConfiguredUrl(import.meta.env.VITE_API_BASE_URL);

export const API_HOST =
  configuredBackendHost || (import.meta.env.PROD ? "" : DEFAULT_API_HOST);

export const API_BASE_URL =
  configuredApiBaseUrl || (API_HOST ? `${API_HOST}/api` : "/api");

export const BACKEND_BASE_URL = API_HOST;

export const APP_NAME = "TungZone";

export default {
  API_HOST,
  API_BASE_URL,
  BACKEND_BASE_URL,
  APP_NAME,
};
