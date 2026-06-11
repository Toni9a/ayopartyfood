import { MenuItem } from "./types";

export const PROTEINS = ["Beef", "Chicken", "Turkey", "Croaker Fish"];
export const SOUPS = ["Efo Riro", "Egusi", "Ewedu and Gbegiri"];

function item(
  name: string,
  category: MenuItem["category"],
  stock: number,
  opts?: Pick<MenuItem, "requiresProtein" | "requiresSoup">
): MenuItem {
  return { name, category, stock, initialStock: stock, ...opts };
}

export const DEFAULT_MENU: MenuItem[] = [
  item("Jollof Rice",             "main",    50, { requiresProtein: true }),
  item("Fried Rice",              "main",    50, { requiresProtein: true }),
  item("Ofada and Ayamase Sauce", "main",    20, { requiresProtein: true }),
  item("Amala / Abula",           "main",    25, { requiresSoup: true }),
  item("Pound Yam",               "main",    25, { requiresSoup: true }),
  item("Yam Porridge",            "main",    15, { requiresSoup: true }),
  item("Plantain",                "side",    30),
  item("Efo Riro",                "soup",    20),
  item("Egusi",                   "soup",    20),
  item("Ewedu and Gbegiri",       "soup",    20),
  item("Beef",                    "protein", 20),
  item("Chicken",                 "protein", 20),
  item("Turkey",                  "protein", 20),
  item("Croaker Fish",            "protein", 20),
];

// Only mains are shown to guests
export function guestMains(menu: MenuItem[]) {
  return menu.filter((m) => m.category === "main");
}
