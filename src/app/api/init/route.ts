import { NextResponse } from "next/server";
import { initSchema } from "@/lib/db";

export async function POST() {
  try {
    await initSchema();
    return NextResponse.json({ success: true, message: "Schema created and menu seeded." });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
