import { MenuItem } from "./types";

export const PROTEINS = ["Beef", "Chicken", "Turkey", "Croaker Fish"];
export const SOUPS = ["Efo Riro", "Egusi", "Ewedu and Gbegiri"];

export const DEFAULT_MENU: MenuItem[] = [
  { name: "Jollof Rice",              category: "main", requiresProtein: true,  stock: 50 },
  { name: "Fried Rice",               category: "main", requiresProtein: true,  stock: 50 },
  { name: "Ofada and Ayamase Sauce",  category: "main", requiresProtein: true,  stock: 20 },
  { name: "Amala / Abula",            category: "main", requiresSoup: true,     stock: 25 },
  { name: "Pound Yam",                category: "main", requiresSoup: true,     stock: 25 },
  { name: "Yam Porridge",             category: "main", requiresSoup: true,     stock: 15 },
  { name: "Plantain",                 category: "side",                         stock: 30 },
  { name: "Efo Riro",                 category: "soup",                         stock: 20 },
  { name: "Egusi",                    category: "soup",                         stock: 20 },
  { name: "Ewedu and Gbegiri",        category: "soup",                         stock: 20 },
  { name: "Beef",                     category: "protein",                      stock: 20 },
  { name: "Chicken",                  category: "protein",                      stock: 20 },
  { name: "Turkey",                   category: "protein",                      stock: 20 },
  { name: "Croaker Fish",             category: "protein",                      stock: 20 },
];

// Only mains are shown to guests
export function guestMains(menu: MenuItem[]) {
  return menu.filter((m) => m.category === "main");
}
