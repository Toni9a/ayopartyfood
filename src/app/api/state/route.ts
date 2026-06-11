import { NextResponse } from "next/server";
import { getState } from "@/lib/store";

export function GET() {
  return NextResponse.json(getState());
}
