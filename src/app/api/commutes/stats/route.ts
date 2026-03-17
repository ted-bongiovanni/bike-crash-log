import { NextResponse } from "next/server";
import { getCommuteStats } from "@/lib/db";

export async function GET() {
  const stats = getCommuteStats();
  return NextResponse.json(stats);
}
