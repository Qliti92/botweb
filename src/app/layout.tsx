import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { getSiteSettings } from "@/services/site-settings";
import { PageAnalytics } from "@/components/page-analytics";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
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
    verification: settings.googleSiteVerification ? { google: settings.googleSiteVerification } : undefined,
    category: "shopping"
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
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
        <PageAnalytics />
        <ServiceWorkerRegistration />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        {settings.googleTagManagerId ? (
          <>
            <Script id="google-tag-manager" strategy="lazyOnload">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.googleTagManagerId}');`}</Script>
            <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${settings.googleTagManagerId}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>
          </>
        ) : null}
        {settings.googleAnalyticsId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`} strategy="lazyOnload" />
            <Script id="google-analytics" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${settings.googleAnalyticsId}',{anonymize_ip:true});`}</Script>
          </>
        ) : null}
        {settings.metaPixelId ? (
          <>
            <Script id="meta-pixel" strategy="lazyOnload">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.metaPixelId}');fbq('track','PageView');`}</Script>
            <noscript><img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${settings.metaPixelId}&ev=PageView&noscript=1`} alt="" /></noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}
