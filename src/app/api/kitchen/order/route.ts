import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/store";
import { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = ["queued", "preparing", "ready"];

export async function PATCH(req: NextRequest) {
  const { orderId, status } = await req.json();
  if (!orderId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const order = updateOrderStatus(orderId, status);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}
