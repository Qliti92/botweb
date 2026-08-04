import type { Metadata } from "next";
import Image from "next/image";
import { SeoFooter, SeoHeader } from "@/components/seo-page";
import { articles, getSeoImage } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: { absolute: "Kiến thức hoàn tiền Shopee và TikTok Shop" },
  description: "Hướng dẫn tạo link, theo dõi đơn, đối soát và rút tiền hoàn khi mua hàng Shopee hoặc TikTok Shop.",
  alternates: { canonical: "/kien-thuc" },
  openGraph: {
    type: "website",
    url: "/kien-thuc",
    title: "Kiến thức hoàn tiền Shopee và TikTok Shop",
    description: "Hướng dẫn tạo link, theo dõi đơn, đối soát và rút tiền hoàn khi mua hàng Shopee hoặc TikTok Shop.",
    images: [{ url: "/images/seo/tao-link-hoan-tien.webp", alt: "Hướng dẫn hoàn tiền mua hàng cùng Qbot" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiến thức hoàn tiền Shopee và TikTok Shop",
    description: "Hướng dẫn tạo link, theo dõi đơn, đối soát và rút tiền hoàn khi mua hàng Shopee hoặc TikTok Shop.",
    images: ["/images/seo/tao-link-hoan-tien.webp"]
  }
};

export default function KnowledgeHubPage() {
  const shopee = articles.filter((item) => item.slug.includes("shopee"));
  const tiktok = articles.filter((item) => item.slug.includes("tiktok"));
  const platformSlugs = new Set([...shopee, ...tiktok].map((item) => item.slug));
  const operations = articles.filter((item) =>
    !platformSlugs.has(item.slug) && /(don-hang|tien-hoan|rut-tien|doi-soat|trang-thai|kiem-tra)/.test(item.slug)
  );
  const groupedSlugs = new Set([...shopee, ...tiktok, ...operations].map((item) => item.slug));
  const groups = [
    { name: "Hoàn tiền Shopee", items: shopee },
    { name: "Hoàn tiền TikTok Shop", items: tiktok },
    { name: "Kiểm tra, đơn hàng và rút tiền", items: operations },
    { name: "An toàn và giải đáp", items: articles.filter((item) => !groupedSlugs.has(item.slug)) }
  ];
  return (
    <>
      <SeoHeader />
      <main className="min-h-screen bg-[#fafaf8]">
        <section className="border-b border-[#e1e5e3] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[.15em] text-[#287a63]">Trung tâm kiến thức Qbot</p><h1 className="mt-3 text-4xl font-bold tracking-[-.035em] sm:text-5xl">Hướng dẫn hoàn tiền mua hàng</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">Tìm hiểu cách lấy link, kiểm tra tiền hoàn, theo dõi đơn, đọc kết quả đối soát và bảo vệ tài khoản khi mua hàng.</p></div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          {groups.map((group) => <section key={group.name} className="mb-14"><h2 className="text-2xl font-bold">{group.name}</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{group.items.map((item) => { const image = getSeoImage(item); return <a key={item.slug} href={`/kien-thuc/${item.slug}`} className="overflow-hidden rounded-2xl border border-[#dde2df] bg-white hover:border-[#8fb9aa] hover:shadow-sm"><Image src={image.src} alt={image.alt} width={720} height={405} className="aspect-[16/9] w-full object-cover" /><div className="p-6"><h3 className="font-bold leading-6">{item.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">{item.description}</p><span className="mt-4 block text-sm font-semibold text-[#287a63]">Đọc bài viết →</span></div></a>; })}</div></section>)}
        </div>
      </main>
      <SeoFooter />
    </>
  );
}
