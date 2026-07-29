import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { encryptSecret } from "@/lib/crypto";
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
  cashbackCacheSeconds: z.number().int().min(0).max(3600),
  cashbackPreviewEnabled: z.boolean(),
  cashbackPreviewEmail: z.string().trim().email().max(200).or(z.literal("")),
  cashbackPreviewPassword: z.string().max(500),
  cashbackPreviewConfigured: z.boolean(),
  referralDomains: z.array(z.object({
    domain: z.string().trim().toLowerCase().min(3).max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i, "Domain không hợp lệ."),
    referralCode: z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/, "Mã giới thiệu không hợp lệ."),
    enabled: z.boolean()
  })).max(50).superRefine((items, context) => {
    const domains = new Set<string>();
    items.forEach((item, index) => {
      const normalized = item.domain.replace(/^www\./, "");
      if (domains.has(normalized)) context.addIssue({ code: "custom", path: [index, "domain"], message: "Domain bị trùng." });
      domains.add(normalized);
    });
  })
});

export async function GET() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return NextResponse.json({
    settings: {
      ...settings,
      cashbackPreviewPassword: "",
      cashbackPreviewConfigured: Boolean(settings.cashbackPreviewPassword)
    }
  });
}

export async function PUT(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const current = await getSiteSettings();
    const password = input.cashbackPreviewPassword
      ? encryptSecret(input.cashbackPreviewPassword)
      : current.cashbackPreviewPassword;
    const { cashbackPreviewConfigured: _configured, ...validated } = input;
    const settings = { ...validated, cashbackPreviewPassword: password };
    await saveSiteSettings(settings);
    return NextResponse.json({
      settings: {
        ...settings,
        cashbackPreviewPassword: "",
        cashbackPreviewConfigured: Boolean(password)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu cài đặt." }, { status: 400 });
  }
}
