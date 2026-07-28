import { prisma } from "@/lib/prisma";

export type SiteSettings = {
  siteName: string;
  logoUrl: string;
  avatarUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  organizationName: string;
  organizationEmail: string;
  organizationPhone: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  metaPixelId: string;
  googleSiteVerification: string;
  guestChatRetentionDays: number;
  memberChatRetentionDays: number;
  inactiveSessionRetentionDays: number;
  supportTicketRetentionDays: number;
  autoSubmitShoppingLinks: boolean;
  cashbackCacheSeconds: number;
  referralDomains: { domain: string; referralCode: string; enabled: boolean }[];
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "Qbot - Kiểm tra tiền hoàn",
  logoUrl: "/logo.png",
  avatarUrl: "/logo.png",
  seoTitle: "Qbot | Kiểm tra tiền hoàn Shopee & TikTok Shop",
  seoDescription: "Dán link sản phẩm Shopee hoặc TikTok Shop để Qbot tạo link mua hàng, kiểm tra tiền hoàn dự kiến và theo dõi trạng thái đơn.",
  seoKeywords: "kiểm tra tiền hoàn, hoàn tiền mua hàng, hoàn tiền Shopee, hoàn tiền TikTok Shop, tạo link hoàn tiền, cashback Shopee",
  canonicalUrl: "https://qbot.vn",
  ogTitle: "Qbot | Dán link sản phẩm, kiểm tra tiền hoàn",
  ogDescription: "Tạo link mua hàng và theo dõi tiền hoàn khi mua trên Shopee hoặc TikTok Shop.",
  ogImageUrl: "/images/seo/quy-trinh-hoan-tien-qbot.png",
  twitterTitle: "Qbot | Kiểm tra tiền hoàn trước khi mua",
  twitterDescription: "Dán link Shopee hoặc TikTok Shop để tạo link mua hàng có thể theo dõi.",
  twitterImageUrl: "/images/seo/quy-trinh-hoan-tien-qbot.png",
  robotsIndex: true,
  robotsFollow: true,
  organizationName: "Qbot",
  organizationEmail: "hotro@hoantienmuahang.vn",
  organizationPhone: "+84375823061",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  metaPixelId: "",
  googleSiteVerification: "",
  guestChatRetentionDays: 7,
  memberChatRetentionDays: 30,
  inactiveSessionRetentionDays: 90,
  supportTicketRetentionDays: 180,
  autoSubmitShoppingLinks: true,
  cashbackCacheSeconds: 600,
  referralDomains: []
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const stored = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  if (!stored) return defaultSiteSettings;
  try {
    const settings = { ...defaultSiteSettings, ...JSON.parse(stored.data) } as SiteSettings;
    const legacyCanonicalHosts = new Set(["hoantienmuahang.vn", "chat.hoantienmuahang.vn", "tranquan.vn", "www.tranquan.vn"]);
    try {
      const configuredHost = new URL(settings.canonicalUrl).hostname.toLowerCase();
      if (legacyCanonicalHosts.has(configuredHost) && process.env.NEXT_PUBLIC_APP_URL) {
        settings.canonicalUrl = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
      }
    } catch {
      settings.canonicalUrl = defaultSiteSettings.canonicalUrl;
    }
    return settings;
  } catch {
    return defaultSiteSettings;
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  return prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site", data: JSON.stringify(settings) },
    update: { data: JSON.stringify(settings) }
  });
}
