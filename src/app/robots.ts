import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/services/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const publicAccess = settings.robotsIndex
    ? { allow: "/", disallow: ["/admin/", "/api/"] }
    : { disallow: "/" };
  return {
    rules: [
      { userAgent: "OAI-SearchBot", ...publicAccess },
      { userAgent: "GPTBot", ...publicAccess },
      { userAgent: "ChatGPT-User", ...publicAccess },
      { userAgent: "Google-Extended", ...publicAccess },
      { userAgent: "Googlebot", ...publicAccess },
      { userAgent: "*", ...publicAccess }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
