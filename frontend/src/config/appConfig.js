const DEFAULT_API_HOST = "http://localhost:8085";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_HOST = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_API_HOST
);

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || `${API_HOST}/api`
);

export const BACKEND_BASE_URL = API_HOST;

export const APP_NAME = "TungZone";

export default {
  API_HOST,
  API_BASE_URL,
  BACKEND_BASE_URL,
  APP_NAME,
};
