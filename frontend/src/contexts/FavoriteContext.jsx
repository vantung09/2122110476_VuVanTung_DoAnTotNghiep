import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const FavoriteContext = createContext(null);

const STORAGE_PREFIX = "favoriteItems:";
const GUEST_KEY = "guest";

function getUserKey(user) {
  if (!user) return GUEST_KEY;
  if (user.userId) return `user-${user.userId}`;
  if (user.email) return `email-${user.email}`;
  return GUEST_KEY;
}

function readStoredFavorites(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredFavorites(storageKey, items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export function FavoriteProvider({ children }) {
  const { user } = useAuth();
  const storageKey = `${STORAGE_PREFIX}${getUserKey(user)}`;
  const prevUserRef = useRef(user);
  const [items, setItems] = useState(() => readStoredFavorites(storageKey));

  useEffect(() => {
    const prevUser = prevUserRef.current;
    const prevKey = `${STORAGE_PREFIX}${getUserKey(prevUser)}`;
    prevUserRef.current = user;

    if (!user) {
      setItems([]);
      writeStoredFavorites(`${STORAGE_PREFIX}${GUEST_KEY}`, []);
      return;
    }

    if (prevKey !== storageKey) {
      setItems(readStoredFavorites(storageKey));
    }
  }, [storageKey, user]);

  const isFavorite = (id) => items.some((item) => item.id === id);

  const toggleFavorite = (product) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      let next;
      if (exists) {
        next = prev.filter((item) => item.id !== product.id);
      } else {
        next = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            originalPrice: product.originalPrice,
            category: product.category,
            brand: product.brand,
          },
        ];
      }
      writeStoredFavorites(storageKey, next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isFavorite,
      toggleFavorite,
    }),
    [items]
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoriteContext);
}
