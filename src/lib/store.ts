import { Order, MenuItem, StoreState } from "./types";
import { DEFAULT_MENU } from "./menu";

// In-memory store — resets on server restart (local-first event app)
const state: StoreState = {
  orders: [],
  menu: DEFAULT_MENU.map((item) => ({ ...item })),
};

export function getState(): StoreState {
  return state;
}

export function getMenu(): MenuItem[] {
  return state.menu;
}

export function getOrders(): Order[] {
  return state.orders;
}

export function findOrderByDevice(deviceId: string): Order | undefined {
  return state.orders.find((o) => o.deviceId === deviceId);
}

export function addOrder(order: Order): void {
  state.orders.push(order);
  // Deduct stock for each item ordered
  for (const item of order.items) {
    const entry = state.menu.find((m) => m.name === item.name);
    if (entry && entry.stock > 0) entry.stock--;
    if (item.addon) {
      const addon = state.menu.find((m) => m.name === item.addon);
      if (addon && addon.stock > 0) addon.stock--;
    }
  }
}

export function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Order | null {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.status = status;
  return order;
}

export function updateMenuStock(name: string, stock: number): boolean {
  const item = state.menu.find((m) => m.name === name);
  if (!item) return false;
  item.stock = stock;
  return true;
}

export function resetDevice(deviceId: string): boolean {
  const index = state.orders.findIndex((o) => o.deviceId === deviceId);
  if (index === -1) return false;
  state.orders.splice(index, 1);
  return true;
}

export function resetByName(guestName: string): boolean {
  const index = state.orders.findIndex(
    (o) => o.guestName.toLowerCase() === guestName.toLowerCase()
  );
  if (index === -1) return false;
  state.orders.splice(index, 1);
  return true;
}

export function resetAll(): number {
  const count = state.orders.length;
  state.orders.splice(0, count);
  return count;
}
