import path from "path";

const safeFilename = /^[a-z0-9][a-z0-9._-]{0,199}$/i;

export function uploadStorageRoot() {
  const configured = process.env.UPLOAD_STORAGE_DIR?.trim();
  if (configured) return path.resolve(configured);
  if (process.env.NODE_ENV === "production") return path.resolve("/var/lib/botweb/uploads");
  return path.resolve(process.cwd(), "public", "uploads");
}

export function brandingStorageDirectory() {
  return path.join(uploadStorageRoot(), "branding");
}

export function brandingFilePath(filename: string) {
  if (!safeFilename.test(filename)) return null;
  return path.join(brandingStorageDirectory(), filename);
}

export function brandingAssetUrl(filename: string) {
  if (!safeFilename.test(filename)) throw new Error("Tên tệp ảnh không hợp lệ.");
  return `/api/uploads/branding/${encodeURIComponent(filename)}`;
}

export function brandingFilenameFromUrl(value: string) {
  const match = value.match(/^\/(?:api\/)?uploads\/branding\/([^/?#]+)$/i);
  if (!match) return null;
  try {
    const filename = decodeURIComponent(match[1]);
    return safeFilename.test(filename) ? filename : null;
  } catch {
    return null;
  }
}
