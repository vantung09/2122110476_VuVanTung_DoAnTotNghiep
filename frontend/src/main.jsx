import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { FavoriteProvider } from "./contexts/FavoriteContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SearchHistoryProvider } from "./contexts/SearchHistoryContext";
import { CouponProvider } from "./contexts/CouponContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider } from "./contexts/ToastContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <AuthProvider>
          <FavoriteProvider>
            <CartProvider>
              <NotificationProvider>
                <SearchHistoryProvider>
                  <CouponProvider>
                    <ChatProvider>
                      <App />
                    </ChatProvider>
                  </CouponProvider>
                </SearchHistoryProvider>
              </NotificationProvider>
            </CartProvider>
          </FavoriteProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
