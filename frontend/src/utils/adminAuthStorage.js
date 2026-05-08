export const ADMIN_AUTH_KEYS = ["admin_token", "admin_fullName", "admin_email", "admin_role", "admin_userId"];

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

export function isAdminTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function clearAdminAuth() {
  ADMIN_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getStoredAdminUser() {
  const token = localStorage.getItem("admin_token");
  if (!token) return null;

  if (isAdminTokenExpired(token)) {
    clearAdminAuth();
    return null;
  }

  return {
    token,
    fullName: localStorage.getItem("admin_fullName"),
    email: localStorage.getItem("admin_email"),
    role: localStorage.getItem("admin_role"),
    userId: localStorage.getItem("admin_userId"),
  };
}

export function storeAdminAuth(payload) {
  ADMIN_AUTH_KEYS.forEach((key) => {
    const value = payload?.[key.replace("admin_", "")];
    if (value == null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  });
}
