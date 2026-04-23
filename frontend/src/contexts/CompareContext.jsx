import { createContext, useContext, useMemo, useState } from "react";

const CompareContext = createContext(null);
const MAX_COMPARE = 4;
const STORAGE_KEY = "compareItems";

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(readStored);

  const addToCompare = (product) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [
        ...prev,
        {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          originalPrice: product.originalPrice,
          category: product.category,
          brand: product.brand,
          stock: product.stock,
          description: product.description,
          active: product.active,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeFromCompare = (id) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearCompare = () => {
    setItems([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  const isInCompare = (id) => items.some((i) => i.id === id);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      maxCompare: MAX_COMPARE,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
    }),
    [items]
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
