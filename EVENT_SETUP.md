# Swapping this app for a new event

## 1. Change the event name

Edit the hero header in two files — they're identical:

- `src/app/page.tsx`
- `src/app/table/[tableNumber]/page.tsx`

Find and replace these three lines:

```tsx
Pastor Joseph & Olukemi Oluniyi
60th Birthday Celebration
```

## 2. Change the menu

Edit `src/lib/menu.ts`.

**Stock numbers** — change the second argument of each `item()` call:
```ts
item("Jollof Rice", "main", 50, ...)  // 50 = starting stock
```

**Add or remove a dish** — copy an existing line and adjust:
```ts
item("New Dish", "main", 30, { requiresProtein: true, optionalPlantain: true }),
```

**Addon rules per dish:**
| Option | Effect |
|---|---|
| `requiresProtein: true` | Guest must pick a protein (uses `PROTEINS_RICE` list) |
| `requiresSoup: true` | Guest must pick a soup |
| `optionalProtein: true` | Guest can optionally pick a protein after soup (uses `PROTEINS_SWALLOW`) |
| `optionalPlantain: true` | Guest gets a yes/no plantain step |

**Protein and soup lists** — edit the arrays at the top of `menu.ts`:
```ts
export const PROTEINS_RICE    = ["Chicken", "Turkey", "Croaker Fish"];
export const PROTEINS_SWALLOW = ["Mixed protein ...", "Chicken", ...];
export const SOUPS            = ["Efo Riro", "Egusi", "Ewedu and Gbegiri"];
```

## 3. Change food photos

Drop new JPEG images into `public/food/` and update the `FOOD_PHOTO` map in `src/components/GuestOrderingApp.tsx`:

```ts
const FOOD_PHOTO: Record<string, string> = {
  "Jollof Rice": "/food/jollof-rice.jpg",
  // add your new dish here
};
```

## 4. Change the number of tables

The slider goes 1–10. To change the max, find these two lines in `GuestOrderingApp.tsx`:

```tsx
<input type="range" min={1} max={10} ...
{[1,2,3,4,5,6,7,8,9,10].map(n => ...
```

Update both to your new max.

## 5. Deploy and initialise the database

After making changes:

```bash
git add -A && git commit -m "New event setup" && git push
```

Vercel will deploy automatically. Once live, run the init endpoint **once** to apply the new schema and menu:

```bash
curl -X POST https://your-vercel-url.vercel.app/api/init
```

This is safe to run multiple times — it won't touch existing orders, only upserts menu rules.

## 6. Reset all orders between events

From the kitchen dashboard → **Reset** tab → **Reset all**.

Or via curl:
```bash
curl -X DELETE https://your-vercel-url.vercel.app/api/kitchen/device \
  -H "Content-Type: application/json" \
  -d '{"action":"all"}'
```

## 7. Environment variables (Vercel)

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → your project → Connection string |

Add it in Vercel: **Project Settings → Environment Variables**.
