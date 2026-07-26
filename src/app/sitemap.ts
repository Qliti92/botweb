import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/services/site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  if (!settings.robotsIndex) return [];
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const pages = [
    { path: "", priority: 1 },
    { path: "/thong-tin/dieu-khoan-dich-vu", priority: 0.5 },
    { path: "/thong-tin/chinh-sach-bao-mat", priority: 0.5 }
  ];
  return pages.map(({ path, priority }) => ({
    url: `${base}${path}`,
    changeFrequency: path ? "monthly" : "weekly",
    priority
  }));
}
