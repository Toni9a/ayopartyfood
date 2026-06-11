import { NextRequest, NextResponse } from "next/server";
import { addOrder, findOrderByDevice, getMenu } from "@/lib/store";
import { Order } from "@/lib/types";
import { PROTEINS, SOUPS } from "@/lib/menu";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deviceId, guestName, tableNumber, mainName, addon } = body;

  if (!deviceId || !guestName || !tableNumber || !mainName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (findOrderByDevice(deviceId)) {
    return NextResponse.json({ error: "Device has already ordered" }, { status: 409 });
  }

  const menu = getMenu();
  const mainItem = menu.find((m) => m.name === mainName && m.category === "main");
  if (!mainItem) {
    return NextResponse.json({ error: "Invalid main item" }, { status: 400 });
  }

  if (mainItem.requiresProtein && !PROTEINS.includes(addon)) {
    return NextResponse.json({ error: "Protein choice required" }, { status: 400 });
  }
  if (mainItem.requiresSoup && !SOUPS.includes(addon)) {
    return NextResponse.json({ error: "Soup choice required" }, { status: 400 });
  }

  const plantain = menu.find((m) => m.name === "Plantain");

  const items = [
    { name: mainName, addon: addon || undefined },
    ...(plantain ? [{ name: "Plantain" }] : []),
  ];

  const order: Order = {
    id: crypto.randomUUID(),
    deviceId,
    guestName: guestName.trim(),
    tableNumber: Number(tableNumber),
    items,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  addOrder(order);
  return NextResponse.json(order, { status: 201 });
}

export async function GET() {
  const { getOrders } = await import("@/lib/store");
  return NextResponse.json(getOrders());
}
