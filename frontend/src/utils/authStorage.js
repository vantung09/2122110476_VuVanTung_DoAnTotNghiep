export const AUTH_EXPIRED_EVENT = "tungzone:auth-expired";

const AUTH_STORAGE_KEYS = ["token", "fullName", "email", "role", "userId"];

function decodeJwtPayload(token) {
  const [, payload] = String(token || "").split(".");
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = decodeURIComponent(
      atob(paddedBase64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isAuthTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function clearStoredAuth() {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getStoredAuthUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const role = localStorage.getItem("role");
  if (isAuthTokenExpired(token)) {
    clearStoredAuth();
    return null;
  }

  return {
    token,
    fullName: localStorage.getItem("fullName"),
    email: localStorage.getItem("email"),
    role,
    userId: localStorage.getItem("userId"),
  };
}

export function storeAuthUser(payload) {
  AUTH_STORAGE_KEYS.forEach((key) => {
    const value = payload?.[key];
    if (value == null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  });
}

export function notifyAuthExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
