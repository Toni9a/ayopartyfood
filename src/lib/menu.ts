import { MenuItem } from "./types";

export const PROTEINS = [
  "Mixed protein (Beef, shaki, ponmo, Inu eran)",
  "Chicken",
  "Turkey",
  "Croaker Fish",
];
export const SOUPS    = ["Efo Riro", "Egusi", "Ewedu and Gbegiri"];

function item(
  name: string,
  category: MenuItem["category"],
  stock: number,
  opts?: Partial<Pick<MenuItem, "requiresProtein" | "requiresSoup" | "optionalProtein" | "optionalPlantain">>
): MenuItem {
  return { name, category, stock, initialStock: stock, ...opts };
}

export const DEFAULT_MENU: MenuItem[] = [
  // Rice dishes — protein required, plantain optional
  item("Jollof Rice",             "main", 50, { requiresProtein: true, optionalPlantain: true }),
  item("Fried Rice",              "main", 50, { requiresProtein: true, optionalPlantain: true }),
  // Ofada — plantain optional, NO protein
  item("Ofada and Ayamase Sauce", "main", 20, { optionalPlantain: true }),

  // Swallows — soup required + optional protein (except Yam Porridge: no addons)
  item("Amala / Abula", "main", 25, { requiresSoup: true, optionalProtein: true }),
  item("Pound Yam",     "main", 25, { requiresSoup: true, optionalProtein: true }),
  item("Yam Porridge",  "main", 15),

  // Sides / soups / proteins (not shown to guests as standalone)
  item("Plantain",          "side",    30),
  item("Efo Riro",          "soup",    20),
  item("Egusi",             "soup",    20),
  item("Ewedu and Gbegiri", "soup",    20),
  item("Mixed protein (Beef, shaki, ponmo, Inu eran)", "protein", 20),
  item("Chicken",           "protein", 20),
  item("Turkey",            "protein", 20),
  item("Croaker Fish",      "protein", 20),
];

export function guestMains(menu: MenuItem[]) {
  return menu.filter((m) => m.category === "main");
}
