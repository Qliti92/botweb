import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"]
    },
    sitemap: "https://hoantienmuahang.vn/sitemap.xml",
    host: "https://hoantienmuahang.vn"
  };
}
