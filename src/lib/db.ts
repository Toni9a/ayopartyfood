import { neon } from "@neondatabase/serverless";
import { DEFAULT_MENU } from "./menu";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export async function initSchema() {
  const sql = getSql();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id           TEXT PRIMARY KEY,
      device_id    TEXT NOT NULL UNIQUE,
      guest_name   TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      items        JSONB NOT NULL,
      status       TEXT NOT NULL DEFAULT 'queued',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      name              TEXT PRIMARY KEY,
      category          TEXT NOT NULL,
      stock             INTEGER NOT NULL,
      initial_stock     INTEGER NOT NULL,
      requires_protein  BOOLEAN NOT NULL DEFAULT FALSE,
      requires_soup     BOOLEAN NOT NULL DEFAULT FALSE,
      optional_protein  BOOLEAN NOT NULL DEFAULT FALSE,
      optional_plantain BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  // Add missing columns to existing tables (safe to run multiple times)
  await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS optional_protein  BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS optional_plantain BOOLEAN NOT NULL DEFAULT FALSE`;

  // Upsert full menu so any changes to rules are always reflected
  for (const item of DEFAULT_MENU) {
    await sql`
      INSERT INTO menu_items
        (name, category, stock, initial_stock, requires_protein, requires_soup, optional_protein, optional_plantain)
      VALUES (
        ${item.name}, ${item.category}, ${item.stock}, ${item.initialStock},
        ${item.requiresProtein  ?? false},
        ${item.requiresSoup     ?? false},
        ${item.optionalProtein  ?? false},
        ${item.optionalPlantain ?? false}
      )
      ON CONFLICT (name) DO UPDATE SET
        category          = EXCLUDED.category,
        initial_stock     = EXCLUDED.initial_stock,
        requires_protein  = EXCLUDED.requires_protein,
        requires_soup     = EXCLUDED.requires_soup,
        optional_protein  = EXCLUDED.optional_protein,
        optional_plantain = EXCLUDED.optional_plantain
    `;
  }
}
