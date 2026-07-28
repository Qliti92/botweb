"use client";

import { useEffect } from "react";
import { Home, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Lỗi giao diện:", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f6f8] px-4 py-10 text-[#30343b]">
      <section className="w-full max-w-lg rounded-3xl border border-[#ead8d4] bg-white p-6 text-center shadow-[0_24px_70px_rgba(48,52,59,.11)] sm:p-8">
        <img src="/api/site-assets/logo" alt="Em Ry" className="mx-auto h-16 w-16 rounded-2xl border bg-white object-cover" />
        <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-[#b44731]">Có lỗi xảy ra</p>
        <h1 className="mt-2 text-2xl font-bold">Em Ry chưa tải được nội dung</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử tải lại phần này hoặc trở về trang chủ.</p>
        {error.digest ? <p className="mt-2 text-[11px] text-neutral-400">Mã lỗi: {error.digest}</p> : null}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#287a63] px-4 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> Thử lại</button>
          <a href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d6e4de] px-4 text-sm font-bold text-[#287a63]"><Home className="h-4 w-4" /> Về trang chủ</a>
        </div>
      </section>
    </main>
  );
}
