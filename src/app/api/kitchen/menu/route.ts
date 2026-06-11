import { NextRequest, NextResponse } from "next/server";
import { getMenu, updateMenuStock } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await getMenu());
}

export async function PATCH(req: NextRequest) {
  const { name, stock } = await req.json();
  if (!name || typeof stock !== "number" || stock < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const ok = await updateMenuStock(name, stock);
  if (!ok) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ name, stock });
}
