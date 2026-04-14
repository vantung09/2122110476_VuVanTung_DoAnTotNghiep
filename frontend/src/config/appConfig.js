const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const backendBaseUrl = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8080"
);

const apiBaseUrl = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || `${backendBaseUrl}/api`
);

export const BACKEND_BASE_URL = backendBaseUrl;
export const API_BASE_URL = apiBaseUrl;
