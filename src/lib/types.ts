export type OrderStatus = "queued" | "preparing" | "ready";

export interface OrderItem {
  name: string;
  addon?: string;   // soup (swallows) or protein (rice/yam)
  protein?: string; // optional extra protein for swallow dishes
  plantain?: boolean; // optional plantain for rice dishes
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
  requiresProtein?: boolean;   // rice/yam: must pick protein
  requiresSoup?: boolean;      // swallows: must pick soup
  optionalProtein?: boolean;   // amala/poundyam: optional protein after soup
  optionalPlantain?: boolean;  // rice: can optionally add plantain
  stock: number;
  initialStock: number;
}

export interface StoreState {
  orders: Order[];
  menu: MenuItem[];
}
