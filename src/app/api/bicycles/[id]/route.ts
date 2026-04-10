import { NextRequest, NextResponse } from "next/server";
import { deleteBicycle, updateBicycle } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();
  const { name, power_type, description, image_url, home_zip } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const validPowerTypes = ["leg", "pedal_assist", "throttle"];
  if (!power_type || !validPowerTypes.includes(power_type)) {
    return NextResponse.json({ error: "Power type must be leg, pedal_assist, or throttle" }, { status: 400 });
  }

  if (home_zip && !/^\d{5}$/.test(home_zip)) {
    return NextResponse.json({ error: "Zip code must be 5 digits" }, { status: 400 });
  }

  try {
    const bicycle = updateBicycle(numId, {
      name: name.trim(),
      power_type,
      description: description?.trim() || undefined,
      image_url: image_url?.trim() || undefined,
      home_zip: home_zip?.trim() || undefined,
    });
    if (!bicycle) {
      return NextResponse.json({ error: "Bicycle not found" }, { status: 404 });
    }
    return NextResponse.json(bicycle);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update bicycle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const result = deleteBicycle(numId);
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Bicycle not found" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
