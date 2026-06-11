import { NextRequest, NextResponse } from "next/server";
import { resetDevice, resetByName, resetAll } from "@/lib/store";

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { action, deviceId, guestName } = body;

  if (action === "all") {
    const count = await resetAll();
    return NextResponse.json({ success: true, count });
  }
  if (action === "name" && guestName) {
    const ok = await resetByName(guestName);
    if (!ok) return NextResponse.json({ error: "No order found for that name" }, { status: 404 });
    return NextResponse.json({ success: true });
  }
  if (deviceId) {
    const ok = await resetDevice(deviceId);
    if (!ok) return NextResponse.json({ error: "No order found for device" }, { status: 404 });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
