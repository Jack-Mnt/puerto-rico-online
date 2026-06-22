import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "cantidad">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, cantidad: i.cantidad + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, cantidad: qty }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => (i.id === id ? { ...i, cantidad: qty } : i)),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((acc, i) => acc + i.precio_venta * i.cantidad, 0),
      count: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    { name: "pro-cart-v1" },
  ),
);
