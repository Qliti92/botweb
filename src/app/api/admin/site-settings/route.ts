import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { getSiteSettings, saveSiteSettings } from "@/services/site-settings";

const optionalUrl = z.string().trim().max(500).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "URL ảnh không hợp lệ.");
const schema = z.object({
  siteName: z.string().trim().min(2).max(120),
  logoUrl: optionalUrl,
  avatarUrl: optionalUrl,
  seoTitle: z.string().trim().min(10).max(120),
  seoDescription: z.string().trim().min(20).max(320),
  seoKeywords: z.string().trim().max(1000),
  canonicalUrl: z.string().url().max(300),
  ogTitle: z.string().trim().min(5).max(120),
  ogDescription: z.string().trim().min(10).max(320),
  ogImageUrl: optionalUrl,
  twitterTitle: z.string().trim().min(5).max(120),
  twitterDescription: z.string().trim().min(10).max(320),
  twitterImageUrl: optionalUrl,
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  organizationName: z.string().trim().min(2).max(120),
  organizationEmail: z.string().email().max(200),
  organizationPhone: z.string().trim().max(30)
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json({ settings: await getSiteSettings() });
}

export async function PUT(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const settings = schema.parse(await request.json());
    await saveSiteSettings(settings);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu cài đặt." }, { status: 400 });
  }
}
