import { NextRequest, NextResponse } from "next/server";
import { resetDevice } from "@/lib/store";

export async function DELETE(req: NextRequest) {
  const { deviceId } = await req.json();
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }
  const ok = resetDevice(deviceId);
  if (!ok) return NextResponse.json({ error: "No order found for device" }, { status: 404 });
  return NextResponse.json({ success: true });
}
