import { notFound } from "next/navigation";

const endpoint = "https://hoantienmuahang.vn/api/v1/openapi/pages";

function htmlToText(value: unknown) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/h[1-6]\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function PublicInformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/i.test(slug)) notFound();
  const response = await fetch(`${endpoint}/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
  if (!response.ok) notFound();
  const json = await response.json();
  if (json.success === false || !json.data) notFound();
  const page = json.data;

  return (
    <main className="min-h-dvh bg-[#fafaf8] px-4 py-8 text-[#30343b] sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#d9dde3] bg-white shadow-[0_14px_40px_rgba(48,52,59,.07)]">
        <header className="border-b border-[#e7e9ed] bg-[#f1f7f4] px-5 py-5 sm:px-8">
          <a href="/" className="text-xs font-medium text-[#287a63]">← Quay lại trang chủ</a>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.02em] sm:text-3xl">{String(page.title ?? "Thông tin")}</h1>
          {page.meta_description ? <p className="mt-2 text-sm leading-6 text-neutral-500">{String(page.meta_description)}</p> : null}
        </header>
        <div className="whitespace-pre-line px-5 py-6 text-sm leading-7 text-neutral-700 sm:px-8">{htmlToText(page.content)}</div>
        {page.updated_at ? <footer className="border-t border-[#e7e9ed] px-5 py-3 text-xs text-neutral-400 sm:px-8">Cập nhật: {new Date(page.updated_at).toLocaleString("vi-VN")}</footer> : null}
      </article>
    </main>
  );
}
