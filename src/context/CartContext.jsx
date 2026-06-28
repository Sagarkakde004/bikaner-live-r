import { createContext, useContext, useState, useCallback, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "bikaner_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Expire after 4 hours (cart gets stale)
    if (Date.now() - (parsed._ts || 0) > 4 * 60 * 60 * 1000) return {};
    delete parsed._ts;
    return parsed;
  } catch { return {}; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    const data = { ...cart, _ts: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }, [cart]);

  const addItem = useCallback((item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { ...item, qty: (prev[item.id]?.qty || 0) + 1 },
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev => {
      const next = { ...prev };
      if (!next[id]) return prev;
      next[id] = { ...next[id], qty: next[id].qty - 1 };
      if (next[id].qty <= 0) delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }, []);

  const items      = Object.values(cart);
  const totalQty   = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, items, totalQty, totalPrice, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
