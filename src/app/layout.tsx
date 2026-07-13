import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hoantienmuahang.vn"),
  title: {
    default: "Hoàn Tiền Mua Hàng | Shopee & TikTok Shop",
    template: "%s | Hoàn Tiền Mua Hàng"
  },
  description: "Tạo link hoàn tiền Shopee và TikTok Shop nhanh chóng. Theo dõi đơn hàng, số dư ví, rút tiền và hoa hồng giới thiệu ngay trong chat.",
  applicationName: "Hoàn Tiền Mua Hàng",
  authors: [{ name: "Hoàn Tiền Mua Hàng", url: "https://hoantienmuahang.vn" }],
  creator: "Hoàn Tiền Mua Hàng",
  publisher: "Hoàn Tiền Mua Hàng",
  keywords: [
    "hoàn tiền mua hàng",
    "hoàn tiền Shopee",
    "hoàn tiền TikTok Shop",
    "tạo link hoàn tiền",
    "cashback Shopee",
    "cashback TikTok Shop"
  ],
  alternates: {
    canonical: "/",
    languages: { "vi-VN": "/" }
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
    apple: [{ url: "/logo.png", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "Hoàn Tiền Mua Hàng",
    title: "Hoàn Tiền Mua Hàng | Shopee & TikTok Shop",
    description: "Tạo link hoàn tiền, theo dõi đơn hàng và quản lý ví ngay trong chat.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Logo Hoàn Tiền Mua Hàng" }]
  },
  twitter: {
    card: "summary",
    title: "Hoàn Tiền Mua Hàng | Shopee & TikTok Shop",
    description: "Tạo link hoàn tiền, theo dõi đơn hàng và quản lý ví ngay trong chat.",
    images: ["/logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  category: "shopping"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://hoantienmuahang.vn/#organization",
        name: "Hoàn Tiền Mua Hàng",
        url: "https://hoantienmuahang.vn",
        logo: "https://hoantienmuahang.vn/logo.png",
        email: "hotro@hoantienmuahang.vn",
        telephone: "+84375823061"
      },
      {
        "@type": "WebSite",
        "@id": "https://hoantienmuahang.vn/#website",
        url: "https://hoantienmuahang.vn",
        name: "Hoàn Tiền Mua Hàng",
        inLanguage: "vi-VN",
        publisher: { "@id": "https://hoantienmuahang.vn/#organization" }
      },
      {
        "@type": "WebApplication",
        name: "Bot Hoàn Tiền Mua Hàng",
        url: "https://hoantienmuahang.vn",
        applicationCategory: "ShoppingApplication",
        operatingSystem: "Web",
        inLanguage: "vi-VN",
        description: "Công cụ tạo link hoàn tiền cho sản phẩm Shopee và TikTok Shop.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "VND" }
      }
    ]
  };

  return (
    <html lang="vi">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
