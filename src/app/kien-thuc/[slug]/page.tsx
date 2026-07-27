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
    title: content.title,
    description: content.description,
    keywords: [content.keyword, "Em Ry", "hoàn tiền mua hàng"],
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
    "@type": "Article",
    headline: content.title,
    description: content.description,
    url,
    image: `${base}${image.src}`,
    mainEntityOfPage: url,
    inLanguage: "vi-VN",
    author: { "@id": `${base}/#organization` },
    publisher: { "@id": `${base}/#organization` },
    datePublished: "2026-07-27",
    dateModified: "2026-07-27"
  };
  return <><ArticleContent content={content} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></>;
}
