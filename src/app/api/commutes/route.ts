import { NextRequest, NextResponse } from "next/server";
import { getAllCommuteLogs, insertCommuteLog } from "@/lib/db";

export async function GET() {
  const logs = getAllCommuteLogs();
  return NextResponse.json(logs);
}

const VALID_DISTANCES = ["under_2", "2_to_5", "5_to_10", "10_to_15", "15_plus"];
const VALID_TIMES = ["under_15", "15_to_30", "30_to_45", "45_to_60", "60_plus"];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, weather, safety, legs, soul, joys, sorrows, distance_estimate, time_estimate, rush_hour, time_of_day } = body;

  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: "Valid date (YYYY-MM-DD) is required" }, { status: 400 });
  }

  for (const [name, value] of Object.entries({ weather, safety, legs, soul })) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return NextResponse.json({ error: `${name} must be an integer from 1 to 5` }, { status: 400 });
    }
  }

  if (distance_estimate && !VALID_DISTANCES.includes(distance_estimate)) {
    return NextResponse.json({ error: "Invalid distance estimate" }, { status: 400 });
  }

  if (time_estimate && !VALID_TIMES.includes(time_estimate)) {
    return NextResponse.json({ error: "Invalid time estimate" }, { status: 400 });
  }

  if (time_of_day && !["am", "pm"].includes(time_of_day)) {
    return NextResponse.json({ error: "time_of_day must be 'am' or 'pm'" }, { status: 400 });
  }

  const log = insertCommuteLog({
    date,
    weather: Number(weather),
    safety: Number(safety),
    legs: Number(legs),
    soul: Number(soul),
    joys: joys || undefined,
    sorrows: sorrows || undefined,
    distance_estimate: distance_estimate || undefined,
    time_estimate: time_estimate || undefined,
    rush_hour: !!rush_hour,
    time_of_day: time_of_day || undefined,
  });

  return NextResponse.json(log, { status: 201 });
}
