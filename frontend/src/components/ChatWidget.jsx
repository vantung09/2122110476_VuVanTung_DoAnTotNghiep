import { useEffect, useRef, useState } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";

export default function ChatWidget() {
  const { user } = useAuth();
  const { isOpen, messages, openChat, closeChat, sendMessage, refreshMessages } = useChat();
  const [input, setInput] = useState("");
  const [polling, setPolling] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      refreshMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  if (!user) return null;

  return (
    <div className="chat-widget">
      {isOpen ? (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <strong>Hỗ trợ trực tuyến</strong>
              <span className="chat-status-dot" />
            </div>
            <button
              className="chat-close-btn"
              type="button"
              onClick={closeChat}
              aria-label="Đóng chat"
            >
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>Xin chào! Chúng tôi có thể giúp gì cho bạn?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender_type === "user" ? "is-user" : "is-support"}`}
                >
                  <div className="chat-bubble">
                    <p>{msg.message}</p>
                    <span className="chat-time">
                      {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              className="chat-input"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button
              className="chat-send-btn"
              type="submit"
              disabled={!input.trim()}
              aria-label="Gửi"
            >
              ➤
            </button>
          </form>
        </div>
      ) : (
        <button
          className="chat-fab"
          type="button"
          onClick={openChat}
          aria-label="Mở hỗ trợ chat"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 14H5.17L4 17.17V4h16v12ZM7 9h2v2H7Zm4 0h2v2h-2Zm4 0h2v2h-2Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
