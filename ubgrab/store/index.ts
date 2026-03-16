import { create } from 'zustand';
import { getOrder, getOrders, type Order, type OrdersFilters } from '@/lib/api/orders';

// --- Orders slice (кэш + загрузка)
type OrdersState = {
  list: Order[] | null;
  byId: Record<number, Order>;
  listLoading: boolean;
  listError: string | null;
  loadOrders: (filters?: OrdersFilters) => Promise<void>;
  loadOrder: (id: string | number) => Promise<Order | null>;
  setOrders: (orders: Order[]) => void;
  clearOrders: () => void;
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  list: null,
  byId: {},
  listLoading: false,
  listError: null,

  loadOrders: async (filters) => {
    set({ listLoading: true, listError: null });
    try {
      const data = await getOrders(filters);
      const byId: Record<number, Order> = {};
      data.forEach((o) => {
        byId[o.id] = o;
      });
      set({ list: data, byId, listError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders';
      set({ listError: message });
    } finally {
      set({ listLoading: false });
    }
  },

  loadOrder: async (id) => {
    const numId = typeof id === 'string' ? Number(id) : id;
    const existing = get().byId[numId];
    if (existing) return existing;
    try {
      const order = await getOrder(id);
      set((s) => ({
        byId: { ...s.byId, [order.id]: order },
      }));
      return order;
    } catch {
      return null;
    }
  },

  setOrders: (orders) => {
    const byId: Record<number, Order> = {};
    orders.forEach((o) => {
      byId[o.id] = o;
    });
    set({ list: orders, byId });
  },

  clearOrders: () => set({ list: null, byId: {}, listError: null }),
}));

// --- Общий стор (если понадобится глобальное UI/приложение состояние)
type AppState = {
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isHydrated: false,
  setHydrated: (v) => set({ isHydrated: v }),
}));
