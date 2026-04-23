import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const typeIcon = (type) => {
    switch (type) {
      case "order": return "📦";
      case "promotion": return "🏷";
      default: return "🔔";
    }
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button
        className="icon-button"
        type="button"
        aria-label="Thông báo"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a6 6 0 0 0-6 6v4.5l-1.72 1.72a1 1 0 0 0 .7 1.71h14.04a1 1 0 0 0 .7-1.71L18 12.5V8a6 6 0 0 0-6-6Zm0 20a2.5 2.5 0 0 1-2.5-2.5h5A2.5 2.5 0 0 1 12 22Z" />
        </svg>
        {unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}
      </button>

      {isOpen ? (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown-header">
            <strong>Thông báo</strong>
            {unreadCount > 0 ? (
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            ) : null}
          </div>

          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Không có thông báo</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? "unread" : ""}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <span className="notification-type-icon">{typeIcon(n.type)}</span>
                  <div className="notification-body">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span className="muted">
                      {new Date(n.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <button
                    className="notification-delete"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    aria-label="Xóa thông báo"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
