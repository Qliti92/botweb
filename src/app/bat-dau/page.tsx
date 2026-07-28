import type { Metadata } from "next";
import { AdConversionLanding } from "@/components/ad-conversion-landing";

export const metadata: Metadata = {
  title: "Kiểm tra tiền hoàn Shopee và TikTok Shop",
  description: "Dán link sản phẩm Shopee hoặc TikTok Shop, đăng ký miễn phí và kiểm tra khả năng nhận tiền hoàn cùng Em Ry.",
  robots: { index: false, follow: false }
};

export default function ConversionLandingPage() {
  return <AdConversionLanding platform="all" />;
}
