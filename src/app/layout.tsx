import type { Metadata, Viewport } from "next";
import { getSiteSettings } from "@/services/site-settings";
import "./globals.css";

function absoluteUrl(value: string, base: string) {
  try { return new URL(value, base).toString(); } catch { return new URL("/logo.png", base).toString(); }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const base = settings.canonicalUrl;
  return {
    metadataBase: new URL(base),
    title: { default: settings.seoTitle, template: `%s | ${settings.siteName}` },
    description: settings.seoDescription,
    applicationName: settings.siteName,
    authors: [{ name: settings.organizationName, url: base }],
    creator: settings.organizationName,
    publisher: settings.organizationName,
    keywords: settings.seoKeywords.split(",").map((item) => item.trim()).filter(Boolean),
    alternates: { canonical: base, languages: { "vi-VN": base } },
    icons: {
      icon: [{ url: "/api/site-assets/logo" }],
      shortcut: "/api/site-assets/logo",
      apple: [{ url: "/api/site-assets/logo" }]
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: base,
      siteName: settings.siteName,
      title: settings.ogTitle,
      description: settings.ogDescription,
      images: [{ url: absoluteUrl(settings.ogImageUrl, base), alt: settings.organizationName }]
    },
    twitter: {
      card: "summary_large_image",
      title: settings.twitterTitle,
      description: settings.twitterDescription,
      images: [absoluteUrl(settings.twitterImageUrl, base)]
    },
    robots: {
      index: settings.robotsIndex,
      follow: settings.robotsFollow,
      googleBot: {
        index: settings.robotsIndex,
        follow: settings.robotsFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    category: "shopping"
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const base = settings.canonicalUrl;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: settings.organizationName,
        url: base,
        logo: absoluteUrl(settings.logoUrl, base),
        email: settings.organizationEmail,
        telephone: settings.organizationPhone
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: settings.siteName,
        inLanguage: "vi-VN",
        publisher: { "@id": `${base}/#organization` }
      },
      {
        "@type": "WebApplication",
        name: settings.siteName,
        url: base,
        applicationCategory: "ShoppingApplication",
        operatingSystem: "Web",
        inLanguage: "vi-VN",
        description: settings.seoDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "VND" }
      }
    ]
  };

  return (
    <html lang="vi">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
