import { NextRequest, NextResponse } from "next/server";
import { deleteBicycle } from "@/lib/db";

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
