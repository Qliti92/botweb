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
};

export const defaultSiteSettings: SiteSettings = {
  siteName: "Em Ry - Trợ lý hoàn tiền",
  logoUrl: "/logo.png",
  avatarUrl: "/logo.png",
  seoTitle: "Em Ry | Trợ lý hoàn tiền Shopee & TikTok Shop",
  seoDescription: "Tạo link hoàn tiền Shopee và TikTok Shop nhanh chóng. Theo dõi đơn hàng, số dư ví, rút tiền và hoa hồng giới thiệu ngay trong chat.",
  seoKeywords: "hoàn tiền mua hàng, hoàn tiền Shopee, hoàn tiền TikTok Shop, tạo link hoàn tiền, cashback Shopee",
  canonicalUrl: "https://hoantienmuahang.vn",
  ogTitle: "Em Ry | Trợ lý hoàn tiền Shopee & TikTok Shop",
  ogDescription: "Tạo link hoàn tiền, theo dõi đơn hàng và quản lý ví ngay trong chat.",
  ogImageUrl: "/logo.png",
  twitterTitle: "Em Ry | Trợ lý hoàn tiền Shopee & TikTok Shop",
  twitterDescription: "Tạo link hoàn tiền, theo dõi đơn hàng và quản lý ví ngay trong chat.",
  twitterImageUrl: "/logo.png",
  robotsIndex: true,
  robotsFollow: true,
  organizationName: "Hoàn Tiền Mua Hàng",
  organizationEmail: "hotro@hoantienmuahang.vn",
  organizationPhone: "+84375823061"
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const stored = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  if (!stored) return defaultSiteSettings;
  try {
    return { ...defaultSiteSettings, ...JSON.parse(stored.data) };
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
