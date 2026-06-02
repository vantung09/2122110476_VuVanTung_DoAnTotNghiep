const ACCOUNT_KEY = "tungzone:demo-accounts:v1";
const ORDER_KEY = "tungzone:demo-orders:v1";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function makeId(prefix = "local") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toBase64Url(value) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createDemoToken(account) {
  const now = Math.floor(Date.now() / 1000);
  return [
    toBase64Url({ alg: "none", typ: "JWT" }),
    toBase64Url({
      sub: account.email,
      userId: account.id,
      role: account.role || "USER",
      exp: now + TOKEN_TTL_SECONDS,
    }),
    "demo",
  ].join(".");
}

function getAccounts() {
  const accounts = readJson(ACCOUNT_KEY, []);
  return Array.isArray(accounts) ? accounts : [];
}

function saveAccounts(accounts) {
  writeJson(ACCOUNT_KEY, accounts);
}

function toAuthPayload(account) {
  return {
    token: createDemoToken(account),
    fullName: account.fullName,
    email: account.email,
    role: account.role || "USER",
    userId: account.id,
    demoMode: true,
  };
}

function makeNameFromEmail(email) {
  const name = normalizeEmail(email).split("@")[0] || "Khach hang";
  return name
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isBackendUnavailableError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const text = typeof data === "string" ? data.toLowerCase() : "";

  if (!error?.response) return true;
  if ([404, 405, 502, 503, 504].includes(status)) return true;
  if (text.includes("<!doctype html") || text.includes("<html")) return true;
  if (text.includes("not_found") || text.includes("function_invocation_failed")) return true;
  return false;
}

export function isLocalAuthSession(user) {
  const token = user?.token || localStorage.getItem("token") || "";
  return String(token).endsWith(".demo");
}

export function registerLocalUser({ fullName, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !String(password || "").trim()) {
    throw new Error("Vui long nhap email va mat khau.");
  }

  const accounts = getAccounts();
  const existing = accounts.find((account) => account.email === normalizedEmail);
  if (existing) {
    throw new Error("Email nay da co tai khoan tren ban demo.");
  }

  const account = {
    id: makeId("user"),
    fullName: String(fullName || "").trim() || makeNameFromEmail(normalizedEmail),
    email: normalizedEmail,
    password: String(password),
    role: "USER",
    phoneNumber: "",
    address: "",
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  return toAuthPayload(account);
}

export function loginLocalUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !String(password || "").trim()) {
    throw new Error("Vui long nhap email va mat khau.");
  }

  const accounts = getAccounts();
  const existing = accounts.find((account) => account.email === normalizedEmail);

  if (existing) {
    if (existing.password !== String(password)) {
      throw new Error("Email hoac mat khau khong dung.");
    }
    return toAuthPayload(existing);
  }

  const account = {
    id: makeId("user"),
    fullName: makeNameFromEmail(normalizedEmail),
    email: normalizedEmail,
    password: String(password),
    role: "USER",
    phoneNumber: "",
    address: "",
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  return toAuthPayload(account);
}

export function loginLocalGoogleUser({ email, fullName }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Khong lay duoc email tu Google.");
  }

  const accounts = getAccounts();
  const existing = accounts.find((account) => account.email === normalizedEmail);

  if (existing) {
    const next = {
      ...existing,
      fullName: existing.fullName || String(fullName || "").trim() || makeNameFromEmail(normalizedEmail),
      provider: existing.provider || "google",
    };
    saveAccounts(accounts.map((account) => (account.id === existing.id ? next : account)));
    return toAuthPayload(next);
  }

  const account = {
    id: makeId("google"),
    fullName: String(fullName || "").trim() || makeNameFromEmail(normalizedEmail),
    email: normalizedEmail,
    password: "",
    provider: "google",
    role: "USER",
    phoneNumber: "",
    address: "",
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  return toAuthPayload(account);
}

export function requestLocalPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Vui long nhap email.");
  return {
    message: "Ban demo khong gui email. Hay nhap ma 000000 de dat lai mat khau.",
    token: "000000",
  };
}

export function resetLocalPassword({ email, token, newPassword }) {
  if (String(token || "").trim() !== "000000") {
    throw new Error("Ma xac thuc khong dung. Ban demo dung ma 000000.");
  }
  const normalizedEmail = normalizeEmail(email);
  const accounts = getAccounts();
  const index = accounts.findIndex((account) => account.email === normalizedEmail);
  if (index < 0) throw new Error("Khong tim thay tai khoan tren ban demo.");

  accounts[index] = {
    ...accounts[index],
    password: String(newPassword || ""),
  };
  saveAccounts(accounts);
}

export function getLocalProfile(user) {
  const accounts = getAccounts();
  const email = normalizeEmail(user?.email);
  const userId = String(user?.userId || user?.id || "");
  const account =
    accounts.find((item) => item.id === userId) ||
    accounts.find((item) => item.email === email);

  if (account) {
    return {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      role: account.role || "USER",
      phoneNumber: account.phoneNumber || "",
      address: account.address || "",
      createdAt: account.createdAt,
    };
  }

  return {
    id: user?.userId || makeId("user"),
    fullName: user?.fullName || makeNameFromEmail(email),
    email,
    role: user?.role || "USER",
    phoneNumber: "",
    address: "",
    createdAt: new Date().toISOString(),
  };
}

export function updateLocalProfile(user, payload) {
  const current = getLocalProfile(user);
  const accounts = getAccounts();
  const index = accounts.findIndex((item) => item.id === current.id || item.email === current.email);
  const next = {
    ...(index >= 0 ? accounts[index] : current),
    fullName: payload.fullName || current.fullName,
    email: normalizeEmail(payload.email || current.email),
    phoneNumber: payload.phoneNumber || "",
    address: payload.address || "",
  };

  if (index >= 0) accounts[index] = next;
  else accounts.push({ ...next, password: "", role: "USER", createdAt: next.createdAt || new Date().toISOString() });
  saveAccounts(accounts);

  return getLocalProfile(next);
}

function getOrders() {
  const orders = readJson(ORDER_KEY, []);
  return Array.isArray(orders) ? orders : [];
}

function saveOrders(orders) {
  writeJson(ORDER_KEY, orders);
}

export function createLocalOrder({ user, items, totalAmount, customer, deliveryMethod }) {
  const order = {
    id: Date.now(),
    userId: user?.userId || user?.id || "",
    userEmail: normalizeEmail(user?.email),
    customerName: customer?.name || user?.fullName || "",
    customerEmail: normalizeEmail(user?.email),
    customerPhone: String(customer?.phone || "").replace(/\D/g, ""),
    deliveryMethod: deliveryMethod || "home",
    deliveryAddress:
      deliveryMethod === "store"
        ? "Nhan tai cua hang TungZone"
        : [customer?.address, customer?.ward, customer?.city].filter(Boolean).join(", "),
    note: customer?.note || "",
    totalAmount: Number(totalAmount || 0),
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "DEMO_MOMO",
    createdAt: new Date().toISOString(),
    items: (items || []).map((item) => ({
      productId: item.id,
      productName: item.name,
      imageUrl: item.imageUrl || "",
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    })),
  };

  const orders = getOrders();
  saveOrders([order, ...orders]);
  return order;
}

export function getLocalOrders(user) {
  const email = normalizeEmail(user?.email);
  const userId = String(user?.userId || user?.id || "");
  return getOrders()
    .filter((order) => order.userId === userId || order.userEmail === email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLocalOrderDetail(orderId) {
  return getOrders().find((order) => String(order.id) === String(orderId)) || null;
}
