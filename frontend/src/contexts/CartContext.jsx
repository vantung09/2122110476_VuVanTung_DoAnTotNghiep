import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const STORAGE_PREFIX = "cartItems:";
const GUEST_KEY = "guest";

function getUserKey(user) {
  if (!user) return GUEST_KEY;
  if (user.userId) return `user-${user.userId}`;
  if (user.email) return `email-${user.email}`;
  return GUEST_KEY;
}

function readStoredCart(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCart(storageKey, items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = `${STORAGE_PREFIX}${getUserKey(user)}`;
  const prevUserRef = useRef(user);
  const [items, setItems] = useState(() => readStoredCart(storageKey));

  useEffect(() => {
    const prevUser = prevUserRef.current;
    const prevKey = `${STORAGE_PREFIX}${getUserKey(prevUser)}`;
    prevUserRef.current = user;

    if (!user) {
      setItems([]);
      writeStoredCart(`${STORAGE_PREFIX}${GUEST_KEY}`, []);
      return;
    }

    if (prevKey !== storageKey) {
      setItems(readStoredCart(storageKey));
    }
  }, [storageKey, user]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      let next = [...prev];
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
        };
      } else {
        next.push({
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          originalPrice: product.originalPrice,
          category: product.category,
          brand: product.brand,
          quantity,
        });
      }
      writeStoredCart(storageKey, next);
      return next;
    });
  };

  const updateQuantity = (id, quantity) => {
    setItems((prev) => {
      const next = prev
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      writeStoredCart(storageKey, next);
      return next;
    });
  };

  const removeFromCart = (id) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeStoredCart(storageKey, next);
      return next;
    });
  };

  const clearCart = () => {
    writeStoredCart(storageKey, []);
    setItems([]);
  };

  const count = items.reduce((acc, item) => acc + item.quantity, 0);
  const total = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [items, count, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
