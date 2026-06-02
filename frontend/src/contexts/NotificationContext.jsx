import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const STORAGE_PREFIX = "tungzone-notifications:";
const MAX_NOTIFICATIONS = 80;
const POLL_INTERVAL_MS = 60_000;

async function getSupabaseClient() {
  const { default: supabase } = await import("../api/supabaseClient");
  return supabase;
}

function getUserKey(user) {
  if (!user) return "guest";
  if (user.userId) return `user-${user.userId}`;
  if (user.email) return `email-${user.email}`;
  return "guest";
}

function getBackendUserId(user) {
  return user?.userId || user?.email || "guest";
}

function getStorageKey(user) {
  return `${STORAGE_PREFIX}${getUserKey(user)}`;
}

function readStoredNotifications(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeNotification) : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(storageKey, notifications) {
  localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
}

function normalizeNotification(notification) {
  return {
    id: notification?.id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: notification?.user_id || "guest",
    type: notification?.type || "system",
    title: notification?.title || "Thong bao",
    message: notification?.message || "",
    data: notification?.data && typeof notification.data === "object" ? notification.data : {},
    read: Boolean(notification?.read),
    created_at: notification?.created_at || new Date().toISOString(),
  };
}

function getEventKey(notification) {
  return notification?.data?.eventKey || notification?.id;
}

function sortNotifications(notifications) {
  return [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function mergeNotifications(localNotifications, remoteNotifications) {
  const byEvent = new Map();

  [...localNotifications, ...remoteNotifications].forEach((item) => {
    const notification = normalizeNotification(item);
    const eventKey = getEventKey(notification);
    const existing = byEvent.get(eventKey);

    if (!existing) {
      byEvent.set(eventKey, notification);
      return;
    }

    byEvent.set(eventKey, {
      ...notification,
      id: String(existing.id).startsWith("local-") ? notification.id : existing.id,
      read: existing.read || notification.read,
      created_at:
        new Date(existing.created_at) > new Date(notification.created_at)
          ? existing.created_at
          : notification.created_at,
    });
  });

  return sortNotifications([...byEvent.values()]).slice(0, MAX_NOTIFICATIONS);
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatOrderStatus(status) {
  switch (status) {
    case "PENDING":
      return {
        title: "Đơn hàng đã được tạo",
        message: "TungZone đã nhận đơn và sẽ kiểm tra thông tin sớm.",
      };
    case "CONFIRMED":
      return {
        title: "Đơn hàng đã xác nhận",
        message: "Đơn của bạn đang được chuẩn bị để bàn giao vận chuyển.",
      };
    case "SHIPPING":
      return {
        title: "Đơn hàng đang giao",
        message: "Đơn đang trên đường đến bạn. Hãy giữ điện thoại để tiện nhận hàng.",
      };
    case "COMPLETED":
      return {
        title: "Đơn hàng đã hoàn thành",
        message: "Cảm ơn bạn đã mua sắm tại TungZone. Điểm tích lũy đã được cập nhật trong hồ sơ.",
      };
    case "CANCELLED":
      return {
        title: "Đơn hàng đã hủy",
        message: "Đơn đã dừng xử lý. Bạn có thể đặt lại bất kỳ lúc nào khi cần.",
      };
    default:
      return {
        title: "Đơn hàng có cập nhật",
        message: "Trạng thái đơn hàng của bạn vừa được cập nhật.",
      };
  }
}

function buildFlashSaleNotification(product, userId) {
  const discount = Number(product.discountPercent || 0);
  const remaining = Number(product.flashSaleRemaining || product.stock || 0);
  const price = formatPrice(product.price);
  const campaignKey = product.flashSaleStartAt || product.flashSaleEndAt || product.price;
  const discountText = discount > 0 ? ` giảm ${discount}%` : "";
  const remainingText = remaining > 0 ? `, còn ${remaining} suất` : "";

  return normalizeNotification({
    id: `local-flash-sale-${product.id}-${campaignKey}`,
    user_id: userId,
    type: "promotion",
    title: "Flash sale đang chạy",
    message: `${product.name} đang Flash sale${discountText}, giá ${price}${remainingText}.`,
    data: {
      eventKey: `flash-sale:${product.id}:${campaignKey}:${product.price}`,
      productId: product.id,
      actionUrl: `/products/${product.id}`,
    },
  });
}

function buildOrderNotification(order, userId) {
  const statusCopy = formatOrderStatus(order.status);
  return normalizeNotification({
    id: `local-order-${order.id}-${order.status}`,
    user_id: userId,
    type: "order",
    title: statusCopy.title,
    message: `Đơn #${order.id}: ${statusCopy.message} Tổng tiền ${formatPrice(order.totalAmount)}.`,
    data: {
      eventKey: `order:${order.id}:${order.status}`,
      orderId: order.id,
      status: order.status,
      actionUrl: "/profile?tab=orders",
    },
  });
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const storageKey = getStorageKey(user);
  const backendUserId = getBackendUserId(user);
  const [notifications, setNotifications] = useState(() => readStoredNotifications(storageKey));
  const [loading, setLoading] = useState(false);

  const persist = useCallback(
    (nextNotifications) => {
      const normalized = sortNotifications(nextNotifications.map(normalizeNotification)).slice(0, MAX_NOTIFICATIONS);
      writeStoredNotifications(storageKey, normalized);
      setNotifications(normalized);
      return normalized;
    },
    [storageKey]
  );

  const syncRemoteNotification = useCallback(
    async (notification) => {
      if (!user) return;
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      try {
        const eventKey = notification.data?.eventKey;
        let existingId = null;

        if (eventKey) {
          const { data } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", backendUserId)
            .contains("data", { eventKey })
            .maybeSingle();
          existingId = data?.id || null;
        }

        const payload = {
          user_id: backendUserId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          read: notification.read,
        };

        if (existingId) {
          await supabase.from("notifications").update(payload).eq("id", existingId);
        } else {
          await supabase.from("notifications").insert(payload);
        }
      } catch {
        // Local notifications still work when Supabase auth/RLS is not configured.
      }
    },
    [backendUserId, user]
  );

  const upsertNotification = useCallback(
    (notification, options = {}) => {
      const normalized = normalizeNotification(notification);

      setNotifications((prev) => {
        const eventKey = getEventKey(normalized);
        const existing = prev.find((item) => getEventKey(item) === eventKey);
        let next;

        if (existing) {
          next = prev.map((item) =>
            getEventKey(item) === eventKey
              ? {
                  ...normalized,
                  id: existing.id,
                  read: existing.read,
                  created_at: existing.created_at,
                }
              : item
          );
        } else {
          next = [normalized, ...prev];
        }

        const limited = sortNotifications(next).slice(0, MAX_NOTIFICATIONS);
        writeStoredNotifications(storageKey, limited);
        return limited;
      });

      if (options.syncRemote) {
        syncRemoteNotification(normalized);
      }
    },
    [storageKey, syncRemoteNotification]
  );

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const localNotifications = readStoredNotifications(storageKey);
    let remoteNotifications = [];

    if (user) {
      try {
        const supabase = await getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", backendUserId)
            .order("created_at", { ascending: false })
            .limit(50);
          if (!error) remoteNotifications = data || [];
        }
      } catch {
        // ignore
      }
    }

    persist(mergeNotifications(localNotifications, remoteNotifications));
    setLoading(false);
  }, [backendUserId, persist, storageKey, user]);

  const syncGeneratedNotifications = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/products/flash-sale");
      const products = Array.isArray(data) ? data : [];
      products
        .filter((product) => product?.id && product?.flashSaleActive !== false)
        .slice(0, 8)
        .forEach((product) => {
          upsertNotification(buildFlashSaleNotification(product, backendUserId), { syncRemote: Boolean(user) });
        });
    } catch {
      // ignore
    }

    if (!user) return;

    try {
      const { data } = await axiosClient.get("/orders/my");
      const orders = Array.isArray(data) ? data : [];
      orders
        .filter((order) => order?.id && order?.status)
        .slice(0, 20)
        .forEach((order) => {
          upsertNotification(buildOrderNotification(order, backendUserId), { syncRemote: true });
        });
    } catch {
      // ignore
    }
  }, [backendUserId, upsertNotification, user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    syncGeneratedNotifications();

    const intervalId = window.setInterval(syncGeneratedNotifications, POLL_INTERVAL_MS);
    const handleFocus = () => syncGeneratedNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncGeneratedNotifications]);

  const addNotification = useCallback(
    async (type, title, message, data = {}) => {
      const eventKey = data.eventKey || `manual:${type}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
      const notification = normalizeNotification({
        user_id: backendUserId,
        type,
        title,
        message,
        data: { ...data, eventKey },
      });

      upsertNotification(notification, { syncRemote: Boolean(user) });
    },
    [backendUserId, upsertNotification, user]
  );

  const markAsRead = useCallback(
    async (id) => {
      const next = notifications.map((item) => (item.id === id ? { ...item, read: true } : item));
      persist(next);

      if (!String(id).startsWith("local-")) {
        try {
          const supabase = await getSupabaseClient();
          if (supabase) await supabase.from("notifications").update({ read: true }).eq("id", id);
        } catch {
          // ignore
        }
      }
    },
    [notifications, persist]
  );

  const markAllAsRead = useCallback(async () => {
    const next = notifications.map((item) => ({ ...item, read: true }));
    persist(next);

    if (!user) return;
    try {
      const supabase = await getSupabaseClient();
      if (supabase) {
        await supabase.from("notifications").update({ read: true }).eq("user_id", backendUserId).eq("read", false);
      }
    } catch {
      // ignore
    }
  }, [backendUserId, notifications, persist, user]);

  const deleteNotification = useCallback(
    async (id) => {
      const next = notifications.filter((item) => item.id !== id);
      persist(next);

      if (!String(id).startsWith("local-")) {
        try {
          const supabase = await getSupabaseClient();
          if (supabase) await supabase.from("notifications").delete().eq("id", id);
        } catch {
          // ignore
        }
      }
    },
    [notifications, persist]
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh: fetchNotifications,
      syncGeneratedNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      fetchNotifications,
      syncGeneratedNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
