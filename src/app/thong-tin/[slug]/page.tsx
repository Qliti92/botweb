import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { htmlToText } from "@/lib/html-to-text";
import { getSiteSettings } from "@/services/site-settings";

const endpoint = "https://hoantienmuahang.vn/api/v1/openapi/pages";

async function getPublicPage(slug: string) {
  if (!/^[a-z0-9-]{1,100}$/i.test(slug)) return null;
  try {
    const response = await fetch(`${endpoint}/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const json = await response.json();
    if (json.success === false || !json.data) return null;
    return json.data as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublicPage(slug), getSiteSettings()]);
  if (!page) return { title: "Không tìm thấy trang", robots: { index: false, follow: false } };
  const title = String(page.title ?? "Thông tin");
  const description = String(page.meta_description ?? htmlToText(page.content).slice(0, 160));
  const canonical = `/thong-tin/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      siteName: settings.siteName,
      locale: "vi_VN"
    },
    twitter: { card: "summary", title, description }
  };
}

export default async function PublicInformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublicPage(slug), getSiteSettings()]);
  if (!page) notFound();
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const title = String(page.title ?? "Thông tin");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: String(page.meta_description ?? ""),
    url: `${base}/thong-tin/${encodeURIComponent(slug)}`,
    inLanguage: "vi-VN",
    isPartOf: { "@id": `${base}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: base },
        { "@type": "ListItem", position: 2, name: title }
      ]
    },
    dateModified: page.updated_at ? String(page.updated_at) : undefined
  };

  return (
    <main className="min-h-dvh bg-[#fafaf8] px-4 py-8 text-[#30343b] sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#d9dde3] bg-white shadow-[0_14px_40px_rgba(48,52,59,.07)]">
        <header className="border-b border-[#e7e9ed] bg-[#f1f7f4] px-5 py-5 sm:px-8">
          <a href="/" className="text-xs font-medium text-[#287a63]">← Quay lại trang chủ</a>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.02em] sm:text-3xl">{title}</h1>
          {page.meta_description ? <p className="mt-2 text-sm leading-6 text-neutral-500">{String(page.meta_description)}</p> : null}
        </header>
        <div className="whitespace-pre-line px-5 py-6 text-sm leading-7 text-neutral-700 sm:px-8">{htmlToText(page.content)}</div>
        {page.updated_at ? <footer className="border-t border-[#e7e9ed] px-5 py-3 text-xs text-neutral-400 sm:px-8">Cập nhật: {new Date(String(page.updated_at)).toLocaleString("vi-VN")}</footer> : null}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </main>
  );
}
