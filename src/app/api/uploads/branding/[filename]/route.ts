import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { brandingFilePath } from "@/lib/upload-storage";

const contentTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"]
]);

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const filePath = brandingFilePath(filename);
  const contentType = filePath ? contentTypes.get(path.extname(filePath).toLowerCase()) : undefined;
  if (!filePath || !contentType) return new NextResponse("Not found", { status: 404 });

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, immutable",
        "x-content-type-options": "nosniff"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
