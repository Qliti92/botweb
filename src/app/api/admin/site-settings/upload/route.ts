import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

const allowed = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]);

export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "");
    if (!(file instanceof File) || !["logo", "avatar", "seo"].includes(kind)) throw new Error("Tệp tải lên không hợp lệ.");
    const extension = allowed.get(file.type);
    if (!extension) throw new Error("Chỉ hỗ trợ PNG, JPG hoặc WEBP.");
    if (file.size > 2 * 1024 * 1024) throw new Error("Ảnh không được lớn hơn 2MB.");
    const directory = path.join(process.cwd(), "public", "uploads", "branding");
    await mkdir(directory, { recursive: true });
    const filename = `${kind}-${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/branding/${filename}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tải ảnh." }, { status: 400 });
  }
}
