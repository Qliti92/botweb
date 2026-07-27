import type { Metadata } from "next";
import { SeoFooter, SeoHeader } from "@/components/seo-page";
import { articles } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Kiến thức hoàn tiền Shopee và TikTok Shop",
  description: "Hướng dẫn tạo link, theo dõi đơn, đối soát và rút tiền hoàn khi mua hàng Shopee hoặc TikTok Shop.",
  alternates: { canonical: "/kien-thuc" }
};

export default function KnowledgeHubPage() {
  const groups = [
    { name: "Hoàn tiền Shopee", items: articles.slice(0, 7) },
    { name: "Hoàn tiền TikTok Shop", items: articles.slice(7, 13) },
    { name: "Đơn hàng và rút tiền", items: articles.slice(13, 19) },
    { name: "An toàn và giải đáp", items: articles.slice(19) }
  ];
  return (
    <>
      <SeoHeader />
      <main className="min-h-screen bg-[#fafaf8]">
        <section className="border-b border-[#e1e5e3] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[.15em] text-[#287a63]">Trung tâm kiến thức</p><h1 className="mt-3 text-4xl font-bold tracking-[-.035em] sm:text-5xl">Hướng dẫn hoàn tiền mua hàng</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">Tìm hiểu cách lấy link, tạo link, theo dõi đơn, đọc kết quả đối soát và bảo vệ tài khoản khi dùng Em Ry.</p></div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          {groups.map((group) => <section key={group.name} className="mb-14"><h2 className="text-2xl font-bold">{group.name}</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{group.items.map((item) => <a key={item.slug} href={`/kien-thuc/${item.slug}`} className="rounded-2xl border border-[#dde2df] bg-white p-6 hover:border-[#8fb9aa]"><h3 className="font-bold leading-6">{item.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">{item.description}</p><span className="mt-4 block text-sm font-semibold text-[#287a63]">Đọc bài viết →</span></a>)}</div></section>)}
        </div>
      </main>
      <SeoFooter />
    </>
  );
}
