import type { MetadataRoute } from "next";
import { articles, landingPages } from "@/lib/seo-content";
import { getSiteSettings } from "@/services/site-settings";

const pagesEndpoint = "https://hoantienmuahang.vn/api/v1/openapi/pages";

type PublicPage = {
  slug?: unknown;
  updated_at?: unknown;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  if (!settings.robotsIndex) return [];
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const entries: MetadataRoute.Sitemap = [{
    url: base,
    changeFrequency: "weekly",
    priority: 1
  }, {
    url: `${base}/kien-thuc`,
    lastModified: new Date("2026-07-27"),
    changeFrequency: "weekly",
    priority: 0.8
  }];

  for (const page of landingPages) {
    entries.push({
      url: `${base}/${page.slug}`,
      lastModified: new Date("2026-07-27"),
      changeFrequency: "monthly",
      priority: 0.9
    });
  }

  for (const page of articles) {
    entries.push({
      url: `${base}/kien-thuc/${page.slug}`,
      lastModified: new Date("2026-07-27"),
      changeFrequency: "monthly",
      priority: 0.7
    });
  }

  try {
    const response = await fetch(pagesEndpoint, { next: { revalidate: 300 } });
    const json = await response.json();
    if (!response.ok || json.success === false) throw new Error("Cannot load public pages");
    const raw: PublicPage[] = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.items)
        ? json.data.items
        : [];

    for (const page of raw) {
      const slug = String(page.slug ?? "");
      if (!/^[a-z0-9-]{1,100}$/i.test(slug)) continue;
      const updatedAt = page.updated_at ? new Date(String(page.updated_at)) : null;
      entries.push({
        url: `${base}/thong-tin/${encodeURIComponent(slug)}`,
        lastModified: updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : undefined,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  } catch {
    for (const slug of ["dieu-khoan-dich-vu", "chinh-sach-bao-mat"]) {
      entries.push({
        url: `${base}/thong-tin/${slug}`,
        changeFrequency: "monthly",
        priority: 0.5
      });
    }
  }

  return entries;
}
