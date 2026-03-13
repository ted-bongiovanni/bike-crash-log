import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = segments.join("/");

  // Prevent path traversal
  if (filePath.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const mimeType = MIME_TYPES[ext];
  if (!mimeType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "public");
  const fullPath = path.join(dataDir, "uploads", filePath);

  try {
    const buffer = await readFile(fullPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
