import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingContent } from "@/components/seo-page";
import { getSeoImage, landingPageMap, landingPages } from "@/lib/seo-content";
import { getSiteSettings } from "@/services/site-settings";

export function generateStaticParams() {
  return landingPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = landingPageMap.get(slug);
  if (!content) return { robots: { index: false, follow: false } };
  const image = getSeoImage(content);
  return {
    title: content.title,
    description: content.description,
    keywords: [content.keyword, "Em Ry", "hoàn tiền mua hàng"],
    alternates: { canonical: `/${slug}` },
    openGraph: { type: "website", url: `/${slug}`, title: content.title, description: content.description, images: [{ url: image.src, alt: image.alt }] },
    twitter: { card: "summary_large_image", title: content.title, description: content.description, images: [image.src] }
  };
}

export default async function SeoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = landingPageMap.get(slug);
  if (!content) notFound();
  const settings = await getSiteSettings();
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const image = getSeoImage(content);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: content.title,
        description: content.description,
        url: `${base}/${slug}`,
        image: `${base}${image.src}`,
        provider: { "@id": `${base}/#organization` },
        areaServed: { "@type": "Country", name: "Việt Nam" }
      },
      ...(content.faqs?.length ? [{
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }] : [])
    ]
  };
  return <><LandingContent content={content} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></>;
}
