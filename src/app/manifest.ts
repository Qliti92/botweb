import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/services/site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  return {
    name: settings.siteName,
    short_name: settings.siteName.slice(0, 30),
    description: settings.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf8",
    theme_color: "#287a63",
    lang: "vi",
    icons: [
      {
        src: "/api/site-assets/logo",
        sizes: "any",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
