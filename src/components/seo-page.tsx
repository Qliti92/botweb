import Image from "next/image";
import type { SeoContent } from "@/lib/seo-content";
import { articleMap, getSeoImage, landingPageMap } from "@/lib/seo-content";

function contentLink(slug: string) {
  const landing = landingPageMap.get(slug);
  const item = landing ?? articleMap.get(slug);
  return item ? { href: landing ? `/${slug}` : `/kien-thuc/${slug}`, title: item.title } : null;
}

export function SeoHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e1e5e3] bg-[#fafaf8]/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5 font-bold">
          <img src="/api/site-assets/logo" alt="Em Ry" className="h-9 w-9 rounded-full bg-white object-cover ring-1 ring-[#d9dde3]" />
          <span>Em Ry</span>
        </a>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-5 text-sm text-neutral-600 md:flex">
          <a href="/hoan-tien-shopee" className="hover:text-[#287a63]">Shopee</a>
          <a href="/hoan-tien-tiktok-shop" className="hover:text-[#287a63]">TikTok Shop</a>
          <a href="/cach-hoat-dong" className="hover:text-[#287a63]">Cách hoạt động</a>
          <a href="/kien-thuc" className="hover:text-[#287a63]">Kiến thức</a>
        </nav>
        <a href="/" className="rounded-xl bg-[#287a63] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#216653]">Dán link sản phẩm</a>
      </div>
    </header>
  );
}

export function SeoFooter() {
  return (
    <footer className="border-t border-[#e1e5e3] bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-neutral-600 sm:grid-cols-3 sm:px-6">
        <div><strong className="text-[#30343b]">Em Ry</strong><p className="mt-2 leading-6">Trợ lý tạo link và theo dõi tiền hoàn khi mua hàng Shopee, TikTok Shop.</p></div>
        <div><strong className="text-[#30343b]">Hướng dẫn</strong><div className="mt-2 grid gap-2"><a href="/tao-link-hoan-tien">Tạo link hoàn tiền</a><a href="/rut-tien-hoan-tien">Rút tiền hoàn</a><a href="/kien-thuc">Trung tâm kiến thức</a></div></div>
        <div><strong className="text-[#30343b]">Thông tin</strong><div className="mt-2 grid gap-2"><a href="/thong-tin/dieu-khoan-dich-vu">Điều khoản dịch vụ</a><a href="/thong-tin/chinh-sach-bao-mat">Chính sách bảo mật</a></div></div>
      </div>
    </footer>
  );
}

export function LandingContent({ content }: { content: SeoContent }) {
  const image = getSeoImage(content);
  return (
    <>
      <SeoHeader />
      <main className="bg-[#fafaf8] text-[#30343b]">
        <section className="border-b border-[#e1e5e3] bg-[radial-gradient(circle_at_top_right,#dbeee7,transparent_38%)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_.72fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#287a63]">{content.keyword}</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-[-.035em] sm:text-5xl">{content.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">{content.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/" className="rounded-xl bg-[#287a63] px-5 py-3 font-semibold text-white hover:bg-[#216653]">Dán link để bắt đầu</a>
                <a href="#huong-dan" className="rounded-xl border border-[#cfd6d3] bg-white px-5 py-3 font-semibold">Xem hướng dẫn</a>
              </div>
            </div>
            <figure className="overflow-hidden rounded-3xl border border-[#dce3df] bg-white shadow-[0_20px_60px_rgba(40,70,60,.1)]">
              <Image src={image.src} alt={image.alt} width={1672} height={939} priority className="aspect-[16/9] h-auto w-full object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
              <figcaption className="px-5 py-4 text-sm leading-6 text-neutral-500">{image.caption}</figcaption>
            </figure>
          </div>
        </section>
        <section id="huong-dan" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10">
            {content.sections.map((section, index) => (
              <section key={section.heading} className="rounded-2xl border border-[#e0e4e2] bg-white p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#287a63]">Phần {index + 1}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-.02em]">{section.heading}</h2>
                <p className="mt-4 leading-7 text-neutral-600">{section.body}</p>
                {section.bullets ? <ul className="mt-5 grid gap-3">{section.bullets.map((item) => <li key={item} className="flex gap-3 leading-7 text-neutral-700"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#287a63]" />{item}</li>)}</ul> : null}
              </section>
            ))}
          </div>
        </section>
        {content.faqs?.length ? (
          <section className="border-y border-[#e1e5e3] bg-white">
            <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
              <h2 className="text-3xl font-bold tracking-[-.025em]">Câu hỏi thường gặp</h2>
              <div className="mt-7 grid gap-3">{content.faqs.map((faq) => <details key={faq.question} className="rounded-xl border border-[#dde2df] bg-[#fafaf8] p-5"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-3 leading-7 text-neutral-600">{faq.answer}</p></details>)}</div>
            </div>
          </section>
        ) : null}
        <RelatedLinks slugs={content.related} />
        <Cta />
      </main>
      <SeoFooter />
    </>
  );
}

export function ArticleContent({ content }: { content: SeoContent }) {
  const image = getSeoImage(content);
  return (
    <>
      <SeoHeader />
      <main className="bg-[#fafaf8] text-[#30343b]">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-neutral-500"><a href="/">Trang chủ</a> <span aria-hidden>›</span> <a href="/kien-thuc">Kiến thức</a></nav>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[.14em] text-[#287a63]">{content.keyword}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-.035em] sm:text-5xl">{content.title}</h1>
          <p className="mt-6 border-l-4 border-[#287a63] pl-5 text-lg leading-8 text-neutral-600">{content.intro}</p>
          <figure className="mt-9 overflow-hidden rounded-2xl border border-[#dce3df] bg-white shadow-[0_14px_40px_rgba(40,70,60,.08)]">
            <Image src={image.src} alt={image.alt} width={1672} height={939} priority className="aspect-[16/9] h-auto w-full object-cover" sizes="(max-width: 768px) 100vw, 768px" />
            <figcaption className="px-5 py-3 text-sm leading-6 text-neutral-500">{image.caption}</figcaption>
          </figure>
          <div className="mt-12 grid gap-12">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold tracking-[-.02em]">{section.heading}</h2>
                <p className="mt-4 text-[17px] leading-8 text-neutral-700">{section.body}</p>
                {section.bullets ? <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-neutral-700">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </section>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-[#cfe0d9] bg-[#edf7f3] p-6">
            <h2 className="text-xl font-bold">Bạn đã có link sản phẩm?</h2>
            <p className="mt-2 leading-7 text-neutral-600">Quay lại Em Ry để kiểm tra link và bắt đầu mua hàng theo đúng quy trình ghi nhận.</p>
            <a href="/" className="mt-5 inline-block rounded-xl bg-[#287a63] px-5 py-3 font-semibold text-white">Dán link sản phẩm</a>
          </div>
        </article>
        <RelatedLinks slugs={content.related} />
      </main>
      <SeoFooter />
    </>
  );
}

function RelatedLinks({ slugs }: { slugs: string[] }) {
  const links = slugs.map(contentLink).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h2 className="text-2xl font-bold">Nội dung liên quan</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{links.map((item) => <a key={item.href} href={item.href} className="rounded-2xl border border-[#dde2df] bg-white p-5 font-semibold leading-6 hover:border-[#8fb9aa] hover:text-[#287a63]">{item.title}<span className="mt-3 block text-sm font-medium text-[#287a63]">Đọc hướng dẫn →</span></a>)}</div>
    </section>
  );
}

function Cta() {
  return <section className="bg-[#245f50] px-4 py-14 text-center text-white"><h2 className="text-3xl font-bold">Bắt đầu từ một link sản phẩm</h2><p className="mx-auto mt-3 max-w-xl text-white/80">Mở Em Ry, dán link Shopee hoặc TikTok Shop và làm theo hướng dẫn.</p><a href="/" className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-bold text-[#245f50]">Mở Em Ry</a></section>;
}
