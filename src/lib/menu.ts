import { MenuItem } from "./types";

// Rice dishes: no mixed protein
export const PROTEINS_RICE    = ["Chicken", "Turkey", "Croaker Fish", "Hake Fish"];
// Swallow dishes: all proteins including mixed
export const PROTEINS_SWALLOW = [
  "Mixed protein (Beef, shaki, ponmo, Inu eran)",
  "Chicken",
  "Turkey",
  "Croaker Fish",
  "Hake Fish",
];
export const SOUPS = ["Efo Riro", "Egusi", "Ewedu and Gbegiri"];

// Keep a flat list for validation
export const ALL_PROTEINS = [
  "Mixed protein (Beef, shaki, ponmo, Inu eran)",
  "Chicken",
  "Turkey",
  "Croaker Fish",
  "Hake Fish",
];

function item(
  name: string,
  category: MenuItem["category"],
  stock: number,
  opts?: Partial<Pick<MenuItem, "requiresProtein" | "requiresSoup" | "optionalProtein" | "optionalPlantain">>
): MenuItem {
  return { name, category, stock, initialStock: stock, ...opts };
}

export const DEFAULT_MENU: MenuItem[] = [
  // Rice — protein required (no mixed), plantain optional
  item("Jollof Rice",             "main", 50, { requiresProtein: true, optionalPlantain: true }),
  item("Fried Rice",              "main", 50, { requiresProtein: true, optionalPlantain: true }),
  // Ofada — plantain optional only, no protein
  item("Ofada and Ayamase Sauce", "main", 20, { optionalPlantain: true }),

  // Swallows — soup required; amala + pounded yam get optional protein (all proteins)
  item("Amala / Abula", "main", 25, { requiresSoup: true, optionalProtein: true }),
  item("Pound Yam",     "main", 25, { requiresSoup: true, optionalProtein: true }),
  item("Yam Porridge",  "main", 15),

  item("Plantain",          "side",    30),
  item("Efo Riro",          "soup",    20),
  item("Egusi",             "soup",    20),
  item("Ewedu and Gbegiri", "soup",    20),
  item("Mixed protein (Beef, shaki, ponmo, Inu eran)", "protein", 20),
  item("Chicken",           "protein", 20),
  item("Turkey",            "protein", 20),
  item("Croaker Fish",      "protein", 20),
  item("Hake Fish",         "protein", 20),
];
