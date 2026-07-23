import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const endpoint = "https://hoantienmuahang.vn/api/v1/openapi/pages";

function htmlToText(value: unknown) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/h[1-6]\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`public-page:${ip}`, 60, 60_000).ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/i.test(slug)) return NextResponse.json({ error: "Trang không hợp lệ." }, { status: 400 });

  try {
    const response = await fetch(`${endpoint}/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    const json = await response.json();
    if (!response.ok || json.success === false) throw new Error(String(json.message ?? "Không thể tải trang."));
    const data = json.data ?? {};
    return NextResponse.json({
      page: {
        slug: String(data.slug ?? slug),
        title: String(data.title ?? "Thông tin"),
        content: htmlToText(data.content),
        metaDescription: String(data.meta_description ?? ""),
        updatedAt: data.updated_at ? String(data.updated_at) : null
      }
    });
  } catch {
    return NextResponse.json({ error: "Chưa thể tải nội dung trang." }, { status: 502 });
  }
}
