import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSiteSettings } from "@/services/site-settings";
import { brandingFilePath, brandingFilenameFromUrl } from "@/lib/upload-storage";

const contentTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"]
]);

async function localImageResponse(configuredPath: string) {
  const brandingFilename = brandingFilenameFromUrl(configuredPath);
  if (brandingFilename) {
    const storedPath = brandingFilePath(brandingFilename);
    const storedResponse = storedPath ? await imageResponse(storedPath) : null;
    if (storedResponse) return storedResponse;
  }

  const publicDirectory = path.resolve(process.cwd(), "public");
  const relativePath = configuredPath.replace(/^\/+/, "");
  const filePath = path.resolve(publicDirectory, relativePath);
  const insidePublicDirectory = filePath === publicDirectory || filePath.startsWith(`${publicDirectory}${path.sep}`);
  const contentType = contentTypes.get(path.extname(filePath).toLowerCase());
  if (!insidePublicDirectory || !contentType) return null;

  return imageResponse(filePath);
}

async function imageResponse(filePath: string) {
  const contentType = contentTypes.get(path.extname(filePath).toLowerCase());
  if (!contentType) return null;
  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store, max-age=0",
        "x-content-type-options": "nosniff"
      }
    });
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!["logo", "avatar"].includes(kind)) return new NextResponse("Not found", { status: 404 });

  const settings = await getSiteSettings();
  const configured = kind === "avatar" ? settings.avatarUrl : settings.logoUrl;
  if (configured && !/^https?:\/\//i.test(configured)) {
    const configuredResponse = await localImageResponse(configured);
    if (configuredResponse) return configuredResponse;
  }

  if (/^https?:\/\//i.test(configured)) {
    const response = NextResponse.redirect(configured, 307);
    response.headers.set("cache-control", "no-store, max-age=0");
    return response;
  }

  const fallback = await localImageResponse("/logo.png");
  return fallback ?? new NextResponse("Image not found", { status: 404, headers: { "cache-control": "no-store, max-age=0" } });
}
