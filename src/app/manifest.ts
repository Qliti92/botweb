import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hoàn Tiền Mua Hàng",
    short_name: "Hoàn Tiền",
    description: "Tạo link hoàn tiền Shopee và TikTok Shop ngay trong chat.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf8",
    theme_color: "#e94b2c",
    lang: "vi",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
