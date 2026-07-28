"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, ClipboardPaste, HelpCircle, Link2, LoaderCircle, LockKeyhole, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { classifyShoppingLink } from "@/lib/shopping-link";

type Platform = "all" | "shopee" | "tiktok-shop";

const platformContent = {
  all: {
    label: "Shopee hoặc TikTok Shop",
    shortLabel: "Shopee & TikTok Shop",
    accent: "#287a63",
    pale: "#f1f7f4",
    border: "#d6e4de"
  },
  shopee: {
    label: "Shopee",
    shortLabel: "Shopee",
    accent: "#ee4d2d",
    pale: "#fff5f1",
    border: "#f2d2c8"
  },
  "tiktok-shop": {
    label: "TikTok Shop",
    shortLabel: "TikTok Shop",
    accent: "#20242a",
    pale: "#f4f9f9",
    border: "#d4e5e5"
  }
} as const;

export function AdConversionLanding({ platform }: { platform: Platform }) {
  const content = platformContent[platform];
  const [productLink, setProductLink] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function pasteProductLink() {
    setError("");
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setError("Clipboard chưa có link sản phẩm.");
        return;
      }
      setProductLink(value.trim());
    } catch {
      setError("Trình duyệt chưa cho phép đọc clipboard. Bạn có thể nhấn giữ trong ô rồi chọn Dán.");
    }
  }

  function startCheck(event: FormEvent) {
    event.preventDefault();
    setError("");
    const link = classifyShoppingLink(productLink);
    if (link.kind !== "supported") {
      setError("Bạn hãy dán đầy đủ link sản phẩm Shopee hoặc TikTok Shop.");
      return;
    }
    localStorage.setItem("pending_cashback_link", link.url);
    setShowRegister(true);
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Mật khẩu cần có ít nhất 8 ký tự.");
    if (password !== confirmation) return setError("Hai mật khẩu chưa giống nhau.");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/chat/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          email: email.trim().toLowerCase(),
          password,
          passwordConfirmation: confirmation
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chưa thể đăng ký.");
      if (data.user) {
        localStorage.setItem("chat_session_id", data.id);
        setSuccess(true);
        window.location.href = "/";
        return;
      }
      window.location.href = "/";
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Chưa thể đăng ký.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#fafaf8] text-[#30343b]">
      <header className="border-b border-neutral-200 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/api/site-assets/logo" alt="Em Ry" className="h-10 w-10 rounded-full border object-cover" />
            <div><strong className="block text-sm">Em Ry</strong><span className="text-[11px] text-neutral-500">Trợ lý hoàn tiền mua hàng</span></div>
          </a>
          <a href="/?auth=login" className="text-sm font-semibold text-[#287a63]">Đã có tài khoản? Đăng nhập</a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(40,122,99,.10),transparent_28%),radial-gradient(circle_at_92%_80%,rgba(198,167,106,.14),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_.9fr] lg:py-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: content.accent }}>{content.shortLabel}</span>
              <span className="rounded-full border border-[#d6e4de] bg-white px-3 py-1.5 text-xs font-semibold text-[#287a63]">Miễn phí đăng ký</span>
            </div>

            <h1 className="mt-5 max-w-2xl text-[32px] font-black leading-[1.14] tracking-[-.03em] sm:text-[42px] lg:text-[50px]">
              Kiểm tra tiền hoàn trước khi mua hàng
              <span className="mt-1 block" style={{ color: content.accent }}>trên Shopee &amp; TikTok Shop</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">Dán link sản phẩm, tạo tài khoản miễn phí và mua hàng trên sàn như bình thường.</p>

            <div className="mt-6 grid max-w-xl gap-2.5 text-sm text-neutral-700 sm:grid-cols-3">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-[#287a63]" /> Không cần mật khẩu sàn</span>
              <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 shrink-0 text-[#287a63]" /> Thanh toán trên sàn</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#287a63]" /> Theo dõi trong Em Ry</span>
            </div>

            <div className="mt-7 rounded-2xl border bg-white p-4 shadow-[0_18px_50px_rgba(48,52,59,.09)] sm:p-5" style={{ borderColor: content.border }}>
              {!showRegister ? (
                <form onSubmit={startCheck}>
                  <label htmlFor="product-link" className="text-sm font-bold">Dán link sản phẩm {content.label}</label>
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <Link2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                      <input id="product-link" value={productLink} onChange={(event) => setProductLink(event.target.value)} placeholder={`https://... link sản phẩm ${content.label}`} className="h-14 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 pr-20 text-sm outline-none focus:border-[#287a63] focus:bg-white" />
                      <button type="button" onClick={() => void pasteProductLink()} className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1 rounded-lg bg-[#e8f3ef] px-2.5 text-xs font-bold text-[#287a63] hover:bg-[#dcece6]"><ClipboardPaste className="h-3.5 w-3.5" /> Dán</button>
                    </div>
                    <button type="submit" className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white hover:bg-[#216653]">Kiểm tra tiền hoàn <ArrowRight className="h-4 w-4" /></button>
                  </div>
                  <button type="button" onClick={() => setShowGuide(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#287a63] hover:underline"><HelpCircle className="h-4 w-4" /> Hướng dẫn lấy link sản phẩm</button>
                  <p className="mt-2 text-[11px] text-neutral-500">Tiền hoàn phụ thuộc điều kiện đơn hàng và kết quả duyệt của đối tác.</p>
                </form>
              ) : success ? (
                <div className="py-2 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-6 w-6" /></span>
                  <h2 className="mt-3 text-xl font-bold">Đăng ký thành công</h2>
                  <p className="mt-1 text-sm text-neutral-600">Link sản phẩm đã được giữ lại. Mở Em Ry để tiếp tục kiểm tra.</p>
                  <a href="/" className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white">Tiếp tục với Em Ry <ArrowRight className="h-4 w-4" /></a>
                </div>
              ) : (
                <form onSubmit={register}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.1em] text-[#287a63]">Để ghi nhận tiền hoàn cho bạn</p>
                      <h2 className="mt-1 text-xl font-bold">Tạo tài khoản Em Ry miễn phí</h2>
                      <p className="mt-1.5 max-w-xl text-xs leading-5 text-neutral-600">Tài khoản giúp hệ thống xác định đơn hàng, hoa hồng và số dư tiền hoàn thuộc về bạn. Bạn chỉ cần đăng ký một lần để theo dõi và rút tiền sau này.</p>
                    </div>
                    <button type="button" onClick={() => setShowRegister(false)} className="text-xs font-semibold text-neutral-500 hover:text-neutral-800">Đổi link</button>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email của bạn" autoComplete="email" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                    <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu từ 8 ký tự" autoComplete="new-password" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                    <input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                  </div>
                  <button disabled={loading} type="submit" className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white disabled:opacity-50">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Tạo tài khoản và kiểm tra link</button>
                  <p className="mt-2 text-center text-[11px] text-neutral-500">Không yêu cầu mật khẩu hoặc OTP của {content.label}.</p>
                </form>
              )}
              {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}
            </div>
          </div>

          <aside className="rounded-3xl border border-[#d6e4de] bg-white p-5 shadow-[0_24px_70px_rgba(48,52,59,.10)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#287a63]">Chỉ 4 bước</p>
            <h2 className="mt-2 text-2xl font-bold">Mua hàng như bình thường</h2>
            <ol className="mt-6 grid gap-3">
              {[
                ["1", `Sao chép link sản phẩm trên ${content.label}`],
                ["2", "Dán link vào Em Ry và đăng ký miễn phí"],
                ["3", `Mở link Em Ry gửi để quay lại ${content.label}`],
                ["4", "Theo dõi đơn và tiền hoàn trong tài khoản"]
              ].map(([number, text]) => (
                <li key={number} className="flex items-center gap-3 rounded-2xl p-3.5" style={{ backgroundColor: content.pale }}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black text-white" style={{ backgroundColor: content.accent }}>{number}</span>
                  <span className="text-sm font-semibold leading-5">{text}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <strong className="block">An toàn khi sử dụng</strong>
              Em Ry chỉ xử lý link sản phẩm. Bạn vẫn đăng nhập, chọn địa chỉ và thanh toán trực tiếp trên {content.label}.
            </div>
          </aside>
        </div>
      </section>

      {showGuide ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="link-guide-title">
          <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.1em] text-[#287a63]">Hướng dẫn nhanh</p><h2 id="link-guide-title" className="mt-1 text-xl font-bold">Cách lấy link sản phẩm</h2></div>
              <button type="button" onClick={() => setShowGuide(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600" aria-label="Đóng hướng dẫn"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-[#f1d4ca] bg-[#fff8f4] p-4">
                <span className="inline-flex rounded-full bg-[#ee4d2d] px-3 py-1 text-xs font-bold text-white">Shopee</span>
                <ol className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700">
                  <li><strong>1.</strong> Mở đúng trang sản phẩm muốn mua.</li>
                  <li><strong>2.</strong> Chạm <strong>Chia sẻ</strong>.</li>
                  <li><strong>3.</strong> Chọn <strong>Sao chép đường dẫn</strong>.</li>
                </ol>
                <img src="/images/tutorials/copy-link-shopee.png" alt="Vị trí nút Chia sẻ và Sao chép đường dẫn trên Shopee" className="mt-3 aspect-[3/2] w-full rounded-xl border border-[#f1d4ca] bg-white object-cover" />
              </article>
              <article className="rounded-2xl border border-[#d7e3e4] bg-[#f6fbfb] p-4">
                <span className="inline-flex rounded-full bg-[#20242a] px-3 py-1 text-xs font-bold text-white">TikTok Shop</span>
                <ol className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700">
                  <li><strong>1.</strong> Từ video hoặc live, mở sản phẩm.</li>
                  <li><strong>2.</strong> Chạm <strong>Chia sẻ</strong>.</li>
                  <li><strong>3.</strong> Chọn <strong>Sao chép liên kết</strong>.</li>
                </ol>
                <img src="/images/tutorials/copy-link-tiktok-shop.png" alt="Vị trí nút Chia sẻ và Sao chép liên kết trên TikTok Shop" className="mt-3 aspect-[3/2] w-full rounded-xl border border-[#d7e3e4] bg-white object-cover" />
              </article>
            </div>
            <button type="button" onClick={() => setShowGuide(false)} className="mt-4 h-12 w-full rounded-xl bg-[#287a63] text-sm font-bold text-white">Tôi đã sao chép link</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
