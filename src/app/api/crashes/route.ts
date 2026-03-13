import { NextRequest, NextResponse } from "next/server";
import { getAllCrashes, insertCrash } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters = {
    severity: searchParams.get("severity") || undefined,
    crash_type: searchParams.get("crash_type") || undefined,
    date_from: searchParams.get("date_from") || undefined,
    date_to: searchParams.get("date_to") || undefined,
  };

  const crashes = getAllCrashes(filters);
  return NextResponse.json(crashes);
}

const VALID_SEVERITIES = ["minor", "moderate", "severe"];
const VALID_TYPES = ["vehicle", "road_hazard", "dooring", "solo", "pedestrian", "bicycle", "ebike", "other"];

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lat, lng, location_description, description, severity, crash_type, date_of_crash, reported_to_police } = body as {
    lat: unknown; lng: unknown; location_description: unknown; description: unknown;
    severity: unknown; crash_type: unknown; date_of_crash: unknown; reported_to_police: unknown;
  };

  const errors: string[] = [];

  if (typeof lat !== "number" || lat < -90 || lat > 90) errors.push("lat must be a number between -90 and 90");
  if (typeof lng !== "number" || lng < -180 || lng > 180) errors.push("lng must be a number between -180 and 180");
  if (typeof description !== "string" || description.trim().length === 0) errors.push("description is required");
  if (typeof severity !== "string" || !VALID_SEVERITIES.includes(severity)) errors.push(`severity must be one of: ${VALID_SEVERITIES.join(", ")}`);
  if (typeof crash_type !== "string" || !VALID_TYPES.includes(crash_type)) errors.push(`crash_type must be one of: ${VALID_TYPES.join(", ")}`);
  if (typeof date_of_crash !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date_of_crash)) errors.push("date_of_crash must be YYYY-MM-DD");

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const crash = insertCrash({
    lat: lat as number,
    lng: lng as number,
    location_description: typeof location_description === "string" ? location_description : undefined,
    description: (description as string).trim(),
    severity: severity as string,
    crash_type: crash_type as string,
    date_of_crash: date_of_crash as string,
    reported_to_police: !!reported_to_police,
  });

  return NextResponse.json(crash, { status: 201 });
}
