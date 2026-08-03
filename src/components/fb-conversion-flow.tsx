"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ClipboardPaste, Gift, HelpCircle, Link2, LoaderCircle, LockKeyhole, PartyPopper, ShieldCheck, X } from "lucide-react";
import { classifyShoppingLink } from "@/lib/shopping-link";
import { friendlyRequestError, readApiResponse } from "@/lib/api-response";

type Preview = {
  productName?: string;
  productImage?: string;
  productPrice?: number | string;
  cashbackAmount?: number | string;
  platform: "shopee" | "tiktok";
};

type Stage = "link" | "result" | "register";
const savedPreviewKey = "saved_cashback_preview";

function money(value?: number | string) {
  if (value === undefined || value === null || value === "") return "Đang cập nhật";
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? `${Math.round(numeric).toLocaleString("vi-VN")}đ` : String(value);
}

export function FacebookConversionFlow() {
  const [stage, setStage] = useState<Stage>("link");
  const [productLink, setProductLink] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<"shopee" | "tiktok">("shopee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const lastChecked = useRef("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(savedPreviewKey) ?? "null") as { preview?: Preview; link?: string; expiresAt?: number } | null;
      if (!saved?.preview || !saved.link || !saved.expiresAt || saved.expiresAt < Date.now()) {
        localStorage.removeItem(savedPreviewKey);
        return;
      }
      setProductLink(saved.link);
      setPreview(saved.preview);
      setStage("result");
    } catch {
      localStorage.removeItem(savedPreviewKey);
    }
  }, []);

  function attemptId() {
    const existing = sessionStorage.getItem("registration_attempt_id");
    if (existing) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem("registration_attempt_id", next);
    return next;
  }

  useEffect(() => {
    if (stage !== "link") return;
    const classified = classifyShoppingLink(productLink.trim());
    if (classified.kind !== "supported" || classified.url === lastChecked.current) return;

    const timer = window.setTimeout(async () => {
      lastChecked.current = classified.url;
      setChecking(true);
      setError("");
      setPreview(null);
      localStorage.setItem("pending_cashback_link", classified.url);
      try {
        const response = await fetch("/api/cashback/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: classified.url })
        });
        const data = await readApiResponse(response, "Chưa thể kiểm tra tiền hoàn.");
        if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Chưa thể kiểm tra tiền hoàn.");
        const nextPreview = data.preview as Preview;
        setPreview(nextPreview);
        localStorage.setItem(savedPreviewKey, JSON.stringify({ preview: nextPreview, link: classified.url, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
        const cashbackValue = Number(String(nextPreview.cashbackAmount ?? "0").replace(/[^\d.-]/g, "")) || 0;
        const trackingWindow = window as typeof window & { fbq?: (...args: unknown[]) => void };
        trackingWindow.fbq?.("trackCustom", "CashbackPreview", { platform: nextPreview.platform, value: cashbackValue, currency: "VND" });
        setStage("result");
      } catch (checkError) {
        lastChecked.current = "";
        setError(friendlyRequestError(checkError, "Chưa thể kiểm tra tiền hoàn. Bạn thử lại nhé."));
      } finally {
        setChecking(false);
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [productLink, stage]);

  async function pasteLink() {
    setError("");
    try {
      const value = (await navigator.clipboard.readText()).trim();
      if (!value) return setError("Clipboard chưa có link sản phẩm.");
      lastChecked.current = "";
      setProductLink(value);
    } catch {
      setError("Bạn nhấn giữ trong ô bên dưới rồi chọn Dán nhé.");
    }
  }

  function validateLink(event: FormEvent) {
    event.preventDefault();
    const classified = classifyShoppingLink(productLink.trim());
    if (classified.kind !== "supported") {
      setError("Đây chưa phải link sản phẩm Shopee hoặc TikTok Shop. Bạn kiểm tra lại nhé.");
      return;
    }
    lastChecked.current = "";
    setProductLink(`${classified.url} `);
    window.setTimeout(() => setProductLink(classified.url), 0);
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Bạn kiểm tra lại địa chỉ email.");
    if (password.length < 8) return setError("Mật khẩu cần có ít nhất 8 ký tự.");
    if (password !== confirmation) return setError("Hai mật khẩu chưa giống nhau.");
    if (!acceptedTerms) return setError("Bạn cần đồng ý với điều khoản để tiếp tục.");

    setRegistering(true);
    try {
      const response = await fetch("/api/chat/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          email: email.trim().toLowerCase(),
          password,
          passwordConfirmation: confirmation,
          registrationPath: window.location.pathname,
          registrationContext: "LINK_REGISTER",
          registrationAttemptId: attemptId()
        })
      });
      const data = await readApiResponse(response, "Chưa thể đăng ký.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Chưa thể đăng ký.");
      if (typeof data.id === "string") localStorage.setItem("chat_session_id", data.id);
      localStorage.removeItem(savedPreviewKey);
      window.location.href = "/tro-ly";
    } catch (registerError) {
      setError(friendlyRequestError(registerError, "Chưa thể đăng ký. Bạn thử lại nhé."));
    } finally {
      setRegistering(false);
    }
  }

  const currentStep = stage === "link" ? 1 : stage === "result" ? 2 : 3;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#f3f8f5] px-4 py-6 text-[#26332f] sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(40,122,99,.14),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(248,180,77,.12),transparent_30%)]" />

      <section className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#d9e7e1] bg-white shadow-[0_24px_80px_rgba(31,78,63,.13)]">
        <header className="flex items-center justify-between border-b border-[#e4ece8] px-5 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/api/site-assets/logo" alt="Em Ry" className="h-9 w-9 rounded-full border object-cover" />
            <div><strong className="block text-sm">Em Ry</strong><span className="text-[10px] text-neutral-500">Trợ lý hoàn tiền</span></div>
          </a>
          <div className="flex items-center gap-2"><a href="/tro-ly?auth=login" className="hidden text-[11px] font-bold text-[#287a63] sm:inline">Đã có tài khoản?</a><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Miễn phí</span></div>
        </header>

        <div className="px-5 pt-5 sm:px-7">
          <div className="flex items-center gap-2" aria-label={`Bước ${currentStep} trên 3`}>
            {[1, 2, 3].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${step <= currentStep ? "bg-[#287a63]" : "bg-neutral-200"}`} />)}
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#287a63]">Bước {currentStep} / 3</p>
        </div>

        <div className="px-5 pb-6 pt-3 sm:px-7 sm:pb-8">
          {stage === "link" ? (
            <div>
              <h1 className="text-[28px] font-black leading-[1.15] tracking-[-.035em]">Bạn muốn bắt đầu nhận tiền hoàn?</h1>
              <p className="mt-3 text-sm leading-6 text-neutral-600">Trước tiên, hãy lấy link của một sản phẩm bạn đang muốn mua trên Shopee hoặc TikTok Shop.</p>

              <button type="button" onClick={() => setShowGuide(true)} className="mt-4 flex min-h-12 w-full items-center justify-between rounded-xl border border-[#b8d8cc] bg-[#f1f8f5] px-4 text-left text-sm font-bold text-[#287a63]">
                <span className="inline-flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Chưa biết lấy link?</span>
                <span className="inline-flex items-center gap-1 text-xs">Nhấn vào đây <ArrowRight className="h-3.5 w-3.5" /></span>
              </button>

              <form onSubmit={validateLink} className="mt-5">
                <label htmlFor="fb-product-link" className="text-sm font-bold">Dán link sản phẩm vào đây</label>
                <div className="relative mt-2">
                  <Link2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input id="fb-product-link" autoFocus value={productLink} onChange={(event) => { lastChecked.current = ""; setProductLink(event.target.value); setError(""); }} placeholder="https://shopee.vn/... hoặc vt.tiktok.com/..." className="h-14 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 pr-20 text-sm outline-none transition focus:border-[#287a63] focus:bg-white focus:ring-4 focus:ring-emerald-50" />
                  <button type="button" onClick={() => void pasteLink()} className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1 rounded-lg bg-[#e4f2ed] px-3 text-xs font-black text-[#287a63]"><ClipboardPaste className="h-4 w-4" /> Dán</button>
                </div>
                {checking ? <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><LoaderCircle className="h-4 w-4 animate-spin" /> Em Ry đang kiểm tra tiền hoàn...</div> : null}
                {!checking && productLink ? <button type="submit" className="mt-3 h-11 w-full rounded-xl bg-[#287a63] text-sm font-bold text-white">Kiểm tra link</button> : null}
              </form>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500"><LockKeyhole className="h-3.5 w-3.5" /> Không cần mật khẩu hoặc OTP tài khoản mua hàng</p>
            </div>
          ) : null}

          {stage === "result" && preview ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><PartyPopper className="h-7 w-7" /></span>
              <p className="mt-4 text-sm font-bold text-emerald-700">Tìm thấy rồi!</p>
              <h1 className="mt-1 text-[27px] font-black leading-tight tracking-[-.03em]">Uầy, bạn có thể nhận lại</h1>
              <p className="mt-2 text-[38px] font-black tracking-[-.04em] text-[#287a63]">{money(preview.cashbackAmount)}</p>
              <p className="text-sm text-neutral-600">tiền hoàn cho sản phẩm này đấy</p>
              <p className="mt-2 text-[11px] text-neutral-400">Kết quả đã được giữ trên thiết bị này trong 7 ngày.</p>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[#f7fbf9] p-3 text-left">
                {preview.productImage ? <img src={preview.productImage} alt="" className="h-16 w-16 shrink-0 rounded-xl border bg-white object-cover" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Gift className="h-7 w-7" /></span>}
                <div className="min-w-0"><p className="text-[11px] font-bold uppercase text-neutral-400">{preview.platform === "shopee" ? "Shopee" : "TikTok Shop"}</p><p className="mt-1 line-clamp-2 text-sm font-bold leading-5">{preview.productName || "Sản phẩm của bạn"}</p></div>
              </div>

              <button type="button" onClick={() => setStage("register")} className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] text-sm font-black text-white shadow-lg shadow-emerald-900/10">Tiếp tục nhận tiền hoàn <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => { localStorage.removeItem(savedPreviewKey); setProductLink(""); setStage("link"); setPreview(null); lastChecked.current = ""; }} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500"><ChevronLeft className="h-3.5 w-3.5" /> Thử sản phẩm khác</button>
            </div>
          ) : null}

          {stage === "register" ? (
            <form onSubmit={register}>
              <button type="button" onClick={() => setStage("result")} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500"><ChevronLeft className="h-3.5 w-3.5" /> Quay lại</button>
              <h1 className="text-[27px] font-black leading-tight tracking-[-.03em]">Lưu tiền hoàn về tài khoản của bạn</h1>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Chỉ còn bước cuối. Sau khi tạo tài khoản, Em Ry sẽ mở chatbot và hướng dẫn bạn mua đúng cách.</p>
              <div className="mt-5 grid gap-3">
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email của bạn" autoComplete="email" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu từ 8 ký tự" autoComplete="new-password" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                <input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
              </div>
              <label className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-neutral-600"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#287a63]" /><span>Tôi đồng ý với <a className="font-bold text-[#287a63] underline" href="/thong-tin/dieu-khoan-dich-vu" target="_blank">Điều khoản</a> và <a className="font-bold text-[#287a63] underline" href="/thong-tin/chinh-sach-bao-mat" target="_blank">Chính sách bảo mật</a>.</span></label>
              <button disabled={registering} type="submit" className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] text-sm font-black text-white disabled:opacity-60">{registering ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{registering ? "Đang tạo tài khoản..." : "Tạo tài khoản và mở Em Ry"}</button>
            </form>
          ) : null}

          {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
      </section>

      {showGuide ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#287a63]">Bước 1</p><h2 className="mt-1 text-xl font-black">Lấy link sản phẩm thế nào?</h2></div><button type="button" onClick={() => setShowGuide(false)} className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1"><button type="button" onClick={() => setGuidePlatform("shopee")} className={`h-10 rounded-lg text-sm font-bold ${guidePlatform === "shopee" ? "bg-white text-[#ee4d2d] shadow-sm" : "text-neutral-500"}`}>Shopee</button><button type="button" onClick={() => setGuidePlatform("tiktok")} className={`h-10 rounded-lg text-sm font-bold ${guidePlatform === "tiktok" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>TikTok Shop</button></div>
            <ol className="mt-4 grid gap-2 text-sm leading-6"><li><strong>1.</strong> Mở sản phẩm bạn muốn mua.</li><li><strong>2.</strong> Nhấn nút <strong>Chia sẻ</strong>.</li><li><strong>3.</strong> Chọn <strong>Sao chép liên kết</strong>.</li></ol>
            <img src={guidePlatform === "shopee" ? "/images/tutorials/copy-link-shopee.webp" : "/images/tutorials/copy-link-tiktok-shop.webp"} alt={`Hướng dẫn sao chép link ${guidePlatform === "shopee" ? "Shopee" : "TikTok Shop"}`} className="mt-4 aspect-[3/2] w-full rounded-xl border bg-neutral-50 object-cover" />
            <button type="button" onClick={() => setShowGuide(false)} className="mt-4 h-12 w-full rounded-xl bg-[#287a63] text-sm font-black text-white">Tôi đã lấy được link</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
