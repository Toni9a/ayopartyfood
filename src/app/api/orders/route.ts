import { NextRequest, NextResponse } from "next/server";
import { addOrder, findOrderByDevice, getMenu, getOrders } from "@/lib/store";
import { Order, OrderItem } from "@/lib/types";
import { PROTEINS, SOUPS } from "@/lib/menu";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deviceId, guestName, tableNumber, mainName, addon, protein, plantain } = body;

  if (!deviceId || !guestName || !tableNumber || !mainName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (await findOrderByDevice(deviceId)) {
    return NextResponse.json({ error: "Device has already ordered" }, { status: 409 });
  }

  const menu = await getMenu();
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
  if (mainItem.optionalProtein && protein && !PROTEINS.includes(protein)) {
    return NextResponse.json({ error: "Invalid protein choice" }, { status: 400 });
  }

  const mainOrderItem: OrderItem = {
    name: mainName,
    addon: addon || undefined,
    protein: protein || undefined,
    plantain: mainItem.optionalPlantain ? Boolean(plantain) : undefined,
  };

  const order: Order = {
    id: crypto.randomUUID(),
    deviceId,
    guestName: guestName.trim(),
    tableNumber: Number(tableNumber),
    items: [mainOrderItem],
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  await addOrder(order);
  return NextResponse.json(order, { status: 201 });
}

export async function GET() {
  return NextResponse.json(await getOrders());
}
