import type { Metadata } from "next";
import { FacebookConversionFlow } from "@/components/fb-conversion-flow";

export const metadata: Metadata = {
  title: "Kiểm tra tiền hoàn Shopee, TikTok Shop miễn phí",
  description: "Dán thử link sản phẩm để biết tiền hoàn dự kiến trước khi mua. Không cần mật khẩu hoặc OTP của tài khoản mua hàng.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Mua đúng món bạn thích, có thể nhận thêm tiền hoàn",
    description: "Kiểm tra miễn phí bằng link sản phẩm Shopee hoặc TikTok Shop.",
    images: [{ url: "/images/seo/quy-trinh-hoan-tien-qbot.png", alt: "Quy trình kiểm tra tiền hoàn" }]
  }
};

export default function FacebookConversionPage() {
  return <FacebookConversionFlow />;
}
