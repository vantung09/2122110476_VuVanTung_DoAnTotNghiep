import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";

function NotificationTypeIcon({ type }) {
  if (type === "order") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm2.2.1L12 10.9l5.8-3.3L12 4.4 6.2 7.6ZM6 9.3v6l5 2.8v-6L6 9.3Zm7 8.8 5-2.8v-6l-5 2.8v6Z" />
      </svg>
    );
  }

  if (type === "promotion") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.6 13.2 13.2 20.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 2.8 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.8ZM5 5v6.9l6.8 6.8 7.4-7.4L12.3 5H5Zm2.5 4A1.5 1.5 0 1 1 9 7.5 1.5 1.5 0 0 1 7.5 9Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a6 6 0 0 0-6 6v4.5l-1.72 1.72a1 1 0 0 0 .7 1.71h14.04a1 1 0 0 0 .7-1.71L18 12.5V8a6 6 0 0 0-6-6Zm0 20a2.5 2.5 0 0 1-2.5-2.5h5A2.5 2.5 0 0 1 12 22Z" />
    </svg>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const actionUrl = notification.data?.actionUrl;
    if (actionUrl) {
      setIsOpen(false);
      navigate(actionUrl);
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
              <div className="notification-empty">
                {loading ? "Đang tải thông báo..." : "Chưa có thông báo mới"}
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                >
                  <span className={`notification-type-icon is-${n.type}`}>
                    <NotificationTypeIcon type={n.type} />
                  </span>
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
