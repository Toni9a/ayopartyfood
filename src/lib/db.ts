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
      id          TEXT PRIMARY KEY,
      device_id   TEXT NOT NULL UNIQUE,
      guest_name  TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      items       JSONB NOT NULL,
      status      TEXT NOT NULL DEFAULT 'queued',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      name             TEXT PRIMARY KEY,
      category         TEXT NOT NULL,
      stock            INTEGER NOT NULL,
      initial_stock    INTEGER NOT NULL,
      requires_protein BOOLEAN NOT NULL DEFAULT FALSE,
      requires_soup    BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  // Seed menu if empty
  const rows = await sql`SELECT COUNT(*) as count FROM menu_items`;
  if (Number(rows[0].count) === 0) {
    for (const item of DEFAULT_MENU) {
      await sql`
        INSERT INTO menu_items (name, category, stock, initial_stock, requires_protein, requires_soup)
        VALUES (
          ${item.name}, ${item.category}, ${item.stock}, ${item.initialStock},
          ${item.requiresProtein ?? false}, ${item.requiresSoup ?? false}
        )
        ON CONFLICT (name) DO NOTHING
      `;
    }
  }
}
