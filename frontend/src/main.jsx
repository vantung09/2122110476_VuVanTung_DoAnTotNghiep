import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { FavoriteProvider } from "./contexts/FavoriteContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SearchHistoryProvider } from "./contexts/SearchHistoryContext";
import { CompareProvider } from "./contexts/CompareContext";
import { CouponProvider } from "./contexts/CouponContext";
import { ChatProvider } from "./contexts/ChatContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoriteProvider>
          <CartProvider>
            <NotificationProvider>
              <SearchHistoryProvider>
                <CompareProvider>
                  <CouponProvider>
                    <ChatProvider>
                      <App />
                    </ChatProvider>
                  </CouponProvider>
                </CompareProvider>
              </SearchHistoryProvider>
            </NotificationProvider>
          </CartProvider>
        </FavoriteProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
