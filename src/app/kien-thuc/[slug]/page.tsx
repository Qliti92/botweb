import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/seo-page";
import { articleMap, articles, getSeoImage } from "@/lib/seo-content";
import { getSiteSettings } from "@/services/site-settings";

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = articleMap.get(slug);
  if (!content) return { robots: { index: false, follow: false } };
  const image = getSeoImage(content);
  return {
    title: { absolute: content.title },
    description: content.description,
    keywords: [content.keyword, "Qbot", "hoàn tiền mua hàng", "hoàn tiền Shopee", "hoàn tiền TikTok Shop"],
    alternates: { canonical: `/kien-thuc/${slug}` },
    openGraph: { type: "article", url: `/kien-thuc/${slug}`, title: content.title, description: content.description, images: [{ url: image.src, alt: image.alt }] },
    twitter: { card: "summary_large_image", title: content.title, description: content.description, images: [image.src] }
  };
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = articleMap.get(slug);
  if (!content) notFound();
  const settings = await getSiteSettings();
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const url = `${base}/kien-thuc/${slug}`;
  const image = getSeoImage(content);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: content.title,
        description: content.description,
        url,
        image: `${base}${image.src}`,
        mainEntityOfPage: url,
        inLanguage: "vi-VN",
        author: { "@id": `${base}/#organization` },
        publisher: { "@id": `${base}/#organization` },
        datePublished: content.updatedAt ?? "2026-07-27",
        dateModified: content.updatedAt ?? "2026-07-27"
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: base },
          { "@type": "ListItem", position: 2, name: "Kiến thức", item: `${base}/kien-thuc` },
          { "@type": "ListItem", position: 3, name: content.title, item: url }
        ]
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
  return <><ArticleContent content={content} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></>;
}
