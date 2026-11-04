"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FlowerChoice } from "@/lib/types";

export type CartItem = {
  // Identifica a linha: o mesmo buquê com flores diferentes vira outra linha.
  key: string;
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  sameDay: boolean;
  flowers?: FlowerChoice[];
  quantity: number;
};

export function cartKey(productId: string, flowers?: FlowerChoice[]) {
  if (!flowers?.length) return productId;
  const combo = [...flowers].sort((a, b) => a.flowerId.localeCompare(b.flowerId)).map((f) => `${f.flowerId}:${f.quantity}`);
  return `${productId}|${combo.join(",")}`;
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  allSameDay: boolean;
  add: (item: Omit<CartItem, "quantity" | "key">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "isabella-carrinho";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Carrinhos antigos não tinham "key".
      if (saved) setItems((JSON.parse(saved) as CartItem[]).map((i) => ({ ...i, key: i.key ?? i.productId })));
    } catch {
      // armazenamento indisponível: carrinho fica só na memória
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // idem
    }
  }, [items, loaded]);

  const add = useCallback((item: Omit<CartItem, "quantity" | "key">, quantity = 1) => {
    const key = cartKey(item.productId, item.flowers);
    setItems((current) => {
      const existing = current.find((i) => i.key === key);
      if (existing) {
        return current.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...current, { ...item, key, quantity }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0 ? current.filter((i) => i.key !== key) : current.map((i) => (i.key === key ? { ...i, quantity } : i)),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents: items.reduce((n, i) => n + i.priceCents * i.quantity, 0),
      allSameDay: items.every((i) => i.sameDay),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
