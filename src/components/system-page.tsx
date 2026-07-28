import { Home, MessageCircle } from "lucide-react";

type SystemPageProps = {
  code?: string;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function SystemPage({ code, eyebrow, title, description, children }: SystemPageProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f6f8] px-4 py-10 text-[#30343b]">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#d6e4de] bg-white shadow-[0_24px_70px_rgba(48,52,59,.11)]">
        <div className="border-b border-[#dce8e3] bg-[#f1f7f4] p-6 text-center sm:p-8">
          <img src="/api/site-assets/logo" alt="Em Ry" className="mx-auto h-16 w-16 rounded-2xl border border-[#d6e4de] bg-white object-cover shadow-sm" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-[#287a63]">{eyebrow}</p>
          {code ? <strong className="mt-2 block text-6xl font-black tracking-[-.05em] text-[#287a63]">{code}</strong> : null}
          <h1 className="mt-2 text-2xl font-bold tracking-[-.025em] sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        <div className="p-5 sm:p-6">
          {children}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <a href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#287a63] px-4 text-sm font-bold text-white hover:bg-[#216653]"><Home className="h-4 w-4" /> Về trang chủ</a>
            <a href="/?auth=login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d6e4de] px-4 text-sm font-bold text-[#287a63] hover:bg-[#f1f7f4]"><MessageCircle className="h-4 w-4" /> Mở Em Ry</a>
          </div>
        </div>
      </section>
    </main>
  );
}
