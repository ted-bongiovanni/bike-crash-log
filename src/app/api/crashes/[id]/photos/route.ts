import { NextRequest, NextResponse } from "next/server";
import { insertPhoto, getPhotoCount } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const crashId = parseInt(id);
  if (isNaN(crashId)) {
    return NextResponse.json({ error: "Invalid crash ID" }, { status: 400 });
  }

  const currentCount = getPhotoCount(crashId);
  if (currentCount >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;
  const label = formData.get("label") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const uniqueName = `${crashId}_${crypto.randomBytes(8).toString("hex")}.${ext}`;

  // Save to DATA_DIR/uploads/{crashId}/
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "public");
  const uploadDir = path.join(dataDir, "uploads", String(crashId));
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, uniqueName), buffer);

  const photo = insertPhoto(crashId, uniqueName, label || undefined);

  return NextResponse.json({
    ...photo,
    url: `/uploads/${crashId}/${uniqueName}`,
  }, { status: 201 });
}
