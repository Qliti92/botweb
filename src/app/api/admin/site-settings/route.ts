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
  organizationPhone: z.string().trim().max(30),
  googleAnalyticsId: z.string().trim().max(30).refine((value) => !value || /^G-[A-Z0-9]+$/i.test(value), "GA4 Measurement ID phải có dạng G-XXXXXXXXXX."),
  googleTagManagerId: z.string().trim().max(30).refine((value) => !value || /^GTM-[A-Z0-9]+$/i.test(value), "Google Tag Manager ID phải có dạng GTM-XXXXXXX."),
  metaPixelId: z.string().trim().max(30).refine((value) => !value || /^\d{5,30}$/.test(value), "Meta Pixel ID chỉ được chứa chữ số."),
  googleSiteVerification: z.string().trim().max(200).regex(/^[A-Za-z0-9_-]*$/, "Mã xác minh Google không hợp lệ."),
  guestChatRetentionDays: z.number().int().min(1).max(365),
  memberChatRetentionDays: z.number().int().min(1).max(730),
  inactiveSessionRetentionDays: z.number().int().min(7).max(730),
  supportTicketRetentionDays: z.number().int().min(30).max(1825),
  autoSubmitShoppingLinks: z.boolean(),
  cashbackCacheSeconds: z.number().int().min(0).max(3600)
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
