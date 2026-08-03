import type { Metadata } from "next";
import { ChatApp } from "@/components/chat-app";
import { InstallAppPrompt } from "@/components/install-app-prompt";
import { FacebookConversionFlow } from "@/components/fb-conversion-flow";
import { getSiteSettings } from "@/services/site-settings";

export const metadata: Metadata = {
  title: "Qbot – Kiểm tra tiền hoàn Shopee, TikTok Shop",
  description: "Dán link sản phẩm Shopee hoặc TikTok Shop để Qbot tạo link mua hàng, kiểm tra tiền hoàn dự kiến và theo dõi trạng thái đơn.",
  keywords: ["kiểm tra tiền hoàn", "hoàn tiền Shopee", "hoàn tiền TikTok Shop", "tạo link hoàn tiền", "Qbot"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Qbot – Dán link sản phẩm, kiểm tra tiền hoàn",
    description: "Tạo link mua hàng và theo dõi tiền hoàn khi mua trên Shopee hoặc TikTok Shop.",
    images: [{ url: "/images/seo/quy-trinh-hoan-tien-qbot.png", alt: "Quy trình kiểm tra tiền hoàn bằng Qbot" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Qbot – Kiểm tra tiền hoàn trước khi mua",
    description: "Dán link Shopee hoặc TikTok Shop để tạo link mua hàng có thể theo dõi.",
    images: ["/images/seo/quy-trinh-hoan-tien-qbot.png"]
  }
};

export default async function HomePage() {
  const settings = await getSiteSettings();
  if (settings.homepageMode === "interactive") return <FacebookConversionFlow />;
  return (
    <>
      <ChatApp />
      <InstallAppPrompt />
    </>
  );
}
