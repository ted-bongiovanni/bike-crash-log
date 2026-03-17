import { NextRequest, NextResponse } from "next/server";
import { getAllCommuteLogs, insertCommuteLog } from "@/lib/db";

export async function GET() {
  const logs = getAllCommuteLogs();
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, weather, safety, legs, soul, joys, sorrows } = body;

  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: "Valid date (YYYY-MM-DD) is required" }, { status: 400 });
  }

  for (const [name, value] of Object.entries({ weather, safety, legs, soul })) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return NextResponse.json({ error: `${name} must be an integer from 1 to 5` }, { status: 400 });
    }
  }

  const log = insertCommuteLog({
    date,
    weather: Number(weather),
    safety: Number(safety),
    legs: Number(legs),
    soul: Number(soul),
    joys: joys || undefined,
    sorrows: sorrows || undefined,
  });

  return NextResponse.json(log, { status: 201 });
}
