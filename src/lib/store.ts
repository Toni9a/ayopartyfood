import { Order, MenuItem, StoreState } from "./types";
import { DEFAULT_MENU } from "./menu";
import { getSql } from "./db";

// ── In-memory fallback (local dev without DATABASE_URL) ──────────────────────
const mem: StoreState = {
  orders: [],
  menu: DEFAULT_MENU.map((item) => ({ ...item })),
};

function useDb() { return !!getSql(); }

// ── Helpers to map DB rows ────────────────────────────────────────────────────
function rowToMenuItem(r: Record<string, unknown>): MenuItem {
  return {
    name:            r.name as string,
    category:        r.category as MenuItem["category"],
    stock:            Number(r.stock),
    initialStock:     Number(r.initial_stock),
    requiresProtein:  Boolean(r.requires_protein),
    requiresSoup:     Boolean(r.requires_soup),
    optionalProtein:  Boolean(r.optional_protein),
    optionalPlantain: Boolean(r.optional_plantain),
  };
}

function rowToOrder(r: Record<string, unknown>): Order {
  return {
    id:          r.id as string,
    deviceId:    r.device_id as string,
    guestName:   r.guest_name as string,
    tableNumber: Number(r.table_number),
    items:       r.items as Order["items"],
    status:      r.status as Order["status"],
    createdAt:   String(r.created_at),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getState(): Promise<StoreState> {
  if (!useDb()) return { orders: [...mem.orders], menu: [...mem.menu] };
  const sql = getSql()!;
  const [orders, menu] = await Promise.all([
    sql`SELECT * FROM orders ORDER BY created_at ASC`,
    sql`SELECT * FROM menu_items ORDER BY name`,
  ]);
  return {
    orders: orders.map(rowToOrder),
    menu:   menu.map(rowToMenuItem),
  };
}

export async function getMenu(): Promise<MenuItem[]> {
  if (!useDb()) return [...mem.menu];
  const sql = getSql()!;
  const rows = await sql`SELECT * FROM menu_items ORDER BY name`;
  return rows.map(rowToMenuItem);
}

export async function getOrders(): Promise<Order[]> {
  if (!useDb()) return [...mem.orders];
  const sql = getSql()!;
  const rows = await sql`SELECT * FROM orders ORDER BY created_at ASC`;
  return rows.map(rowToOrder);
}

export async function findOrderByDevice(deviceId: string): Promise<Order | undefined> {
  if (!useDb()) return mem.orders.find((o) => o.deviceId === deviceId);
  const sql = getSql()!;
  const rows = await sql`SELECT * FROM orders WHERE device_id = ${deviceId} LIMIT 1`;
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

export async function addOrder(order: Order): Promise<void> {
  if (!useDb()) {
    mem.orders.push(order);
    for (const item of order.items) {
      const entry = mem.menu.find((m) => m.name === item.name);
      if (entry && entry.stock > 0) entry.stock--;
      if (item.addon) {
        const addon = mem.menu.find((m) => m.name === item.addon);
        if (addon && addon.stock > 0) addon.stock--;
      }
    }
    return;
  }
  const sql = getSql()!;
  await sql`
    INSERT INTO orders (id, device_id, guest_name, table_number, items, status, created_at)
    VALUES (${order.id}, ${order.deviceId}, ${order.guestName}, ${order.tableNumber},
            ${JSON.stringify(order.items)}, ${order.status}, ${order.createdAt})
  `;
  for (const item of order.items) {
    await sql`UPDATE menu_items SET stock = GREATEST(stock - 1, 0) WHERE name = ${item.name}`;
    if (item.addon) {
      await sql`UPDATE menu_items SET stock = GREATEST(stock - 1, 0) WHERE name = ${item.addon}`;
    }
  }
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order | null> {
  if (!useDb()) {
    const order = mem.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    return order;
  }
  const sql = getSql()!;
  const rows = await sql`
    UPDATE orders SET status = ${status} WHERE id = ${orderId} RETURNING *
  `;
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function updateMenuStock(name: string, stock: number): Promise<boolean> {
  if (!useDb()) {
    const item = mem.menu.find((m) => m.name === name);
    if (!item) return false;
    item.stock = stock;
    return true;
  }
  const sql = getSql()!;
  const rows = await sql`
    UPDATE menu_items SET stock = ${stock} WHERE name = ${name} RETURNING name
  `;
  return rows.length > 0;
}

export async function resetDevice(deviceId: string): Promise<boolean> {
  if (!useDb()) {
    const i = mem.orders.findIndex((o) => o.deviceId === deviceId);
    if (i === -1) return false;
    mem.orders.splice(i, 1);
    return true;
  }
  const sql = getSql()!;
  const rows = await sql`DELETE FROM orders WHERE device_id = ${deviceId} RETURNING id`;
  return rows.length > 0;
}

export async function resetByName(guestName: string): Promise<boolean> {
  if (!useDb()) {
    const i = mem.orders.findIndex((o) => o.guestName.toLowerCase() === guestName.toLowerCase());
    if (i === -1) return false;
    mem.orders.splice(i, 1);
    return true;
  }
  const sql = getSql()!;
  const rows = await sql`
    DELETE FROM orders WHERE LOWER(guest_name) = LOWER(${guestName}) RETURNING id
  `;
  return rows.length > 0;
}

export async function resetAll(): Promise<number> {
  if (!useDb()) {
    const count = mem.orders.length;
    mem.orders.splice(0, count);
    return count;
  }
  const sql = getSql()!;
  const rows = await sql`DELETE FROM orders RETURNING id`;
  return rows.length;
}
