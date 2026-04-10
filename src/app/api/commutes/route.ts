import { NextRequest, NextResponse } from "next/server";
import { getAllCommuteLogs, insertCommuteLog } from "@/lib/db";

export async function GET() {
  const logs = getAllCommuteLogs();
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, weather, safety, legs, soul, notes, distance_miles, duration_minutes, rush_hour, time_of_day, bicycle_id } = body;

  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: "Valid date (YYYY-MM-DD) is required" }, { status: 400 });
  }

  for (const [name, value] of Object.entries({ weather, safety, legs, soul })) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return NextResponse.json({ error: `${name} must be an integer from 1 to 5` }, { status: 400 });
    }
  }

  if (distance_miles != null && (isNaN(Number(distance_miles)) || Number(distance_miles) < 0)) {
    return NextResponse.json({ error: "Distance must be a positive number" }, { status: 400 });
  }

  if (duration_minutes != null && (!Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) < 0)) {
    return NextResponse.json({ error: "Duration must be a positive whole number" }, { status: 400 });
  }

  if (time_of_day && !["am", "pm"].includes(time_of_day)) {
    return NextResponse.json({ error: "time_of_day must be 'am' or 'pm'" }, { status: 400 });
  }

  try {
    const log = insertCommuteLog({
      date,
      weather: Number(weather),
      safety: Number(safety),
      legs: Number(legs),
      soul: Number(soul),
      notes: notes || undefined,
      distance_miles: distance_miles != null ? Number(distance_miles) : undefined,
      duration_minutes: duration_minutes != null ? Number(duration_minutes) : undefined,
      rush_hour: !!rush_hour,
      time_of_day: time_of_day || undefined,
      bicycle_id: bicycle_id ? Number(bicycle_id) : undefined,
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save commute";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
