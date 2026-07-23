import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const endpoint = "https://hoantienmuahang.vn/api/v1/openapi/pages";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`public-pages:${ip}`, 60, 60_000).ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const response = await fetch(endpoint, { next: { revalidate: 300 } });
    const json = await response.json();
    if (!response.ok || json.success === false) throw new Error(String(json.message ?? "Không thể tải danh sách trang."));
    const raw = Array.isArray(json.data) ? json.data : Array.isArray(json.data?.items) ? json.data.items : [];
    const pages = raw
      .filter((item: unknown) => item && typeof item === "object")
      .map((item: Record<string, unknown>) => ({ slug: String(item.slug ?? ""), title: String(item.title ?? item.name ?? "") }))
      .filter((item: { slug: string; title: string }) => item.slug && item.title);
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ error: "Chưa thể tải các trang chính sách." }, { status: 502 });
  }
}
