import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/services/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: settings.robotsIndex ? "/" : undefined,
      disallow: settings.robotsIndex ? ["/admin/", "/api/"] : "/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
