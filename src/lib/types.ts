export type OrderStatus = "queued" | "preparing" | "ready";

export interface OrderItem {
  name: string;
  addon?: string; // protein or soup
}

export interface Order {
  id: string;
  deviceId: string;
  guestName: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}

export interface MenuItem {
  name: string;
  category: "main" | "side" | "protein" | "soup";
  requiresProtein?: boolean;
  requiresSoup?: boolean;
  stock: number;
}

export interface StoreState {
  orders: Order[];
  menu: MenuItem[];
}
