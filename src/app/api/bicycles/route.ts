import { NextRequest, NextResponse } from "next/server";
import { getAllBicycles, insertBicycle } from "@/lib/db";

export async function GET() {
  const bicycles = getAllBicycles();
  return NextResponse.json(bicycles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, power_type, description, image_url } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const validPowerTypes = ["leg", "pedal_assist", "throttle"];
  if (!power_type || !validPowerTypes.includes(power_type)) {
    return NextResponse.json({ error: "Power type must be leg, pedal_assist, or throttle" }, { status: 400 });
  }

  try {
    const bicycle = insertBicycle({
      name: name.trim(),
      power_type,
      description: description?.trim() || undefined,
      image_url: image_url?.trim() || undefined,
    });
    return NextResponse.json(bicycle, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save bicycle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
