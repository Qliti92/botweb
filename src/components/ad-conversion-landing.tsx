"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, ClipboardPaste, HelpCircle, Link2, LoaderCircle, LockKeyhole, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { classifyShoppingLink } from "@/lib/shopping-link";
import { registrationErrorCategory, registrationErrorCode } from "@/lib/registration-errors";

type Platform = "all" | "shopee" | "tiktok-shop";
type CashbackPreview = {
  productName?: string;
  productImage?: string;
  productPrice?: number | string;
  cashbackAmount?: number | string;
  platform: "shopee" | "tiktok";
};

function formatPreviewMoney(value?: number | string) {
  if (value === undefined || value === null || value === "") return "Đang cập nhật";
  const numeric = typeof value === "number"
    ? value
    : Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return String(value);
  return `${Math.round(numeric).toLocaleString("vi-VN")}đ`;
}

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
  const [checkedPlatform, setCheckedPlatform] = useState<"shopee" | "tiktok" | null>(null);
  const [preview, setPreview] = useState<CashbackPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [openTrustItem, setOpenTrustItem] = useState<"source" | "account" | "payment" | null>("source");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function registrationAttemptId() {
    const existing = sessionStorage.getItem("registration_attempt_id");
    if (existing) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem("registration_attempt_id", next);
    return next;
  }

  function trackRegistration(stage: "STARTED" | "STEP_2" | "ABANDONED" | "FAILED", details?: {
    errorCategory?: string;
    errorCode?: string;
    errorMessage?: string;
    httpStatus?: number;
    apiResponse?: string;
    inputSnapshot?: { email?: string };
  }) {
    void fetch("/api/analytics/registration", {
      method: "POST",
      keepalive: stage === "ABANDONED",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stage,
        step: stage === "STARTED" ? 1 : 2,
        path: window.location.pathname,
        ...details,
        context: "LINK_REGISTER",
        attemptId: registrationAttemptId()
      })
    }).catch(() => {});
  }

  useEffect(() => {
    if (!showRegister || success) return;
    const onPageHide = () => trackRegistration("ABANDONED");
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [showRegister, success]);

  async function pasteProductLink() {
    setError("");
    try {
      const value = await navigator.clipboard.readText();
      if (!value.trim()) {
        setError("Clipboard chưa có link sản phẩm.");
        return;
      }
      setProductLink(value.trim());
      setCheckedPlatform(null);
    } catch {
      setError("Trình duyệt chưa cho phép đọc clipboard. Bạn có thể nhấn giữ trong ô rồi chọn Dán.");
    }
  }

  async function startCheck(event: FormEvent) {
    event.preventDefault();
    setError("");
    const link = classifyShoppingLink(productLink);
    if (link.kind !== "supported") {
      setError("Bạn hãy dán đầy đủ link sản phẩm Shopee hoặc TikTok Shop.");
      return;
    }
    localStorage.setItem("pending_cashback_link", link.url);
    setCheckedPlatform(null);
    setPreview(null);
    setPreviewLoading(true);
    try {
      const response = await fetch("/api/cashback/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: link.url })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chưa thể kiểm tra tiền hoàn.");
      setCheckedPlatform(link.platform);
      setPreview(data.preview);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Chưa thể kiểm tra tiền hoàn.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function continueToRegister() {
    setShowRegister(true);
    trackRegistration("STARTED");
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    const rejectInput = (message: string) => {
      setError(message);
      const category = registrationErrorCategory(message);
      trackRegistration("FAILED", {
        errorCategory: category,
        errorCode: registrationErrorCode(category),
        errorMessage: message,
        apiResponse: JSON.stringify({ success: false, source: "client_validation", message }),
        inputSnapshot: { email }
      });
    };
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return rejectInput("Bạn kiểm tra lại địa chỉ email.");
    if (password.length < 8) return rejectInput("Mật khẩu cần có ít nhất 8 ký tự.");
    if (password !== confirmation) return rejectInput("Hai mật khẩu chưa giống nhau.");
    if (!acceptedTerms) return rejectInput("Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.");
    if (loading) return;
    setLoading(true);
    setError("");
    trackRegistration("STEP_2");
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
          registrationAttemptId: registrationAttemptId()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const authError = new Error(data.error || "Chưa thể đăng ký.");
        Object.assign(authError, { httpStatus: response.status, apiResponse: JSON.stringify(data) });
        throw authError;
      }
      if (data.user) {
        localStorage.setItem("chat_session_id", data.id);
        setSuccess(true);
        window.location.href = "/";
        return;
      }
      window.location.href = "/";
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : "Chưa thể đăng ký.";
      const httpStatus = Number((registerError as Error & { httpStatus?: number })?.httpStatus || 0) || undefined;
      const apiResponse = (registerError as Error & { apiResponse?: string })?.apiResponse;
      const category = registrationErrorCategory(message, httpStatus);
      trackRegistration("FAILED", {
        errorCategory: category,
        errorCode: registrationErrorCode(category, httpStatus),
        errorMessage: message,
        httpStatus,
        apiResponse,
        inputSnapshot: { email }
      });
      setError(message);
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: content.accent }}>{content.shortLabel}</span>
              <span className="rounded-full border border-[#d6e4de] bg-white px-3 py-1.5 text-xs font-semibold text-[#287a63]">Miễn phí đăng ký</span>
            </div>

            <h1 className="mx-auto mt-5 max-w-[360px] text-center text-[clamp(30px,8.5vw,36px)] font-black leading-[1.1] tracking-[-.035em] [text-wrap:balance] sm:mx-0 sm:max-w-2xl sm:text-left sm:text-[42px] sm:leading-[1.12] lg:text-[50px]">
              <span className="block">Mua sắm trên Shopee, TikTok Shop</span>
              <span className="mt-2 block sm:mt-1" style={{ color: content.accent }}>Có thêm tiền hoàn sau mỗi đơn</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-center text-[15px] leading-6 text-neutral-600 sm:mx-0 sm:mt-5 sm:max-w-xl sm:text-left sm:text-base sm:leading-7">Dán link sản phẩm Shopee hoặc TikTok Shop để xem số tiền hoàn dự kiến trước khi mua.</p>

            <div className="mt-5 grid max-w-xl grid-cols-3 divide-x divide-[#d6e4de] overflow-hidden rounded-xl border border-[#d6e4de] bg-white/80 text-center shadow-sm">
              <span className="flex min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2.5 text-[10px] font-semibold leading-4 text-neutral-700 sm:flex-row sm:gap-2 sm:px-3 sm:text-xs">
                <Link2 className="h-4 w-4 shrink-0 text-[#287a63]" /> Dán link là xong
              </span>
              <span className="flex min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2.5 text-[10px] font-semibold leading-4 text-neutral-700 sm:flex-row sm:gap-2 sm:px-3 sm:text-xs">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#287a63]" /> Không hỏi mật khẩu
              </span>
              <span className="flex min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2.5 text-[10px] font-semibold leading-4 text-neutral-700 sm:flex-row sm:gap-2 sm:px-3 sm:text-xs">
                <Check className="h-4 w-4 shrink-0 text-[#287a63]" /> Hoàn từ hoa hồng
              </span>
            </div>

            <div className="mt-7 rounded-2xl border bg-white p-4 shadow-[0_18px_50px_rgba(48,52,59,.09)] sm:p-5" style={{ borderColor: content.border }}>
              {!showRegister ? (
                <div>
                  <form onSubmit={startCheck}>
                    <label htmlFor="product-link" className="text-sm font-bold">Dán link sản phẩm {content.label}</label>
                    <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 flex-1">
                        <Link2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                        <input id="product-link" value={productLink} onChange={(event) => { setProductLink(event.target.value); setCheckedPlatform(null); setPreview(null); }} placeholder={`https://... link sản phẩm ${content.label}`} className="h-14 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 pr-20 text-sm outline-none focus:border-[#287a63] focus:bg-white" />
                        <button type="button" onClick={() => void pasteProductLink()} className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1 rounded-lg bg-[#e8f3ef] px-2.5 text-xs font-bold text-[#287a63] hover:bg-[#dcece6]"><ClipboardPaste className="h-3.5 w-3.5" /> Dán</button>
                      </div>
                      <button disabled={previewLoading} type="submit" className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white hover:bg-[#216653] disabled:opacity-60">
                        {previewLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        {previewLoading ? "Đang kiểm tra..." : "Kiểm tra tiền hoàn"}
                      </button>
                    </div>
                    <button type="button" onClick={() => setShowGuide(true)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#9ec9b9] bg-[#f1f7f4] px-4 text-sm font-bold text-[#287a63] transition hover:border-[#287a63] hover:bg-[#e4f1ec]">
                      <HelpCircle className="h-5 w-5" /> Chưa biết lấy link? Xem hướng dẫn
                    </button>
                    <p className="mt-2 text-[11px] text-neutral-500">Tiền hoàn phụ thuộc điều kiện đơn hàng và kết quả duyệt của đối tác.</p>
                  </form>

                  {checkedPlatform && preview ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
                      <div className="flex items-center gap-2 border-b border-emerald-200 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-800">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white"><Check className="h-4 w-4" /></span>
                        Đã tìm thấy tiền hoàn
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {preview.productImage ? <img src={preview.productImage} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-emerald-200 bg-white object-cover" /> : null}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-neutral-500">{checkedPlatform === "shopee" ? "Shopee" : "TikTok Shop"}</p>
                            <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-5 text-neutral-800">{preview.productName || "Sản phẩm đã kiểm tra"}</h3>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-white/80 px-3 py-3">
                            <p className="text-[11px] text-neutral-500">Giá sản phẩm</p>
                            <p className="mt-0.5 text-base font-bold text-neutral-700">{formatPreviewMoney(preview.productPrice)}</p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-emerald-200">
                            <p className="text-[11px] text-neutral-500">Tiền hoàn dự kiến</p>
                            <p className="mt-0.5 text-xl font-black text-emerald-700">{formatPreviewMoney(preview.cashbackAmount)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={continueToRegister} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white hover:bg-[#216653]">
                          Tiếp tục nhận tiền hoàn <ArrowRight className="h-4 w-4" />
                        </button>
                        <p className="mt-2 text-center text-[11px] text-neutral-500">
                          Cần tài khoản miễn phí để ghi nhận đơn và tiền hoàn đúng cho bạn.
                        </p>
                      </div>
                    </div>
                  ) : null}

                </div>
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
                      <button type="button" onClick={() => { trackRegistration("ABANDONED"); setShowRegister(false); setCheckedPlatform(null); }} className="text-xs font-semibold text-neutral-500 hover:text-neutral-800">Đổi link</button>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email của bạn" autoComplete="email" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                    <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu từ 8 ký tự" autoComplete="new-password" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                    <input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" className="h-12 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#287a63]" />
                  </div>
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-700 ring-1 ring-neutral-200">
                    <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required className="mt-0.5 h-5 w-5 shrink-0 accent-[#287a63]" />
                    <span>
                      Tôi đồng ý với <a href="/thong-tin/dieu-khoan-dich-vu" target="_blank" rel="noreferrer" className="font-bold text-[#287a63] underline">Điều khoản dịch vụ</a> và <a href="/thong-tin/chinh-sach-bao-mat" target="_blank" rel="noreferrer" className="font-bold text-[#287a63] underline">Chính sách bảo mật</a>.
                    </span>
                  </label>
                  <button disabled={loading} type="submit" className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white disabled:opacity-50">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Tạo tài khoản và kiểm tra link</button>
                  <p className="mt-2 text-center text-[11px] text-neutral-500">Không yêu cầu mật khẩu hoặc OTP của {content.label}.</p>
                </form>
              )}
              {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}
            </div>
          </div>

          <aside className="rounded-3xl border border-[#d6e4de] bg-white p-5 shadow-[0_24px_70px_rgba(48,52,59,.10)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#287a63]">Hiểu rõ trước khi dùng</p>
            <h2 className="mt-2 text-2xl font-bold">Tiền hoàn từ đâu, có an toàn không?</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">QBot chỉ xử lý link sản phẩm, không đăng nhập hoặc thanh toán thay bạn.</p>

            <div className="mt-5 grid gap-2">
              {([
                {
                  id: "source",
                  question: "Tiền hoàn từ đâu?",
                  answer: "Khi bạn mua qua link QBot tạo, sàn có thể trả hoa hồng tiếp thị liên kết cho hệ thống. QBot chia lại một phần khoản hoa hồng đó cho bạn dưới dạng tiền hoàn."
                },
                {
                  id: "account",
                  question: "QBot có đăng nhập tài khoản sàn không?",
                  answer: "Không. QBot không yêu cầu mật khẩu, OTP hay mã xác minh của Shopee/TikTok Shop. Bạn tự đăng nhập và mua hàng trên ứng dụng chính thức của sàn."
                },
                {
                  id: "payment",
                  question: "QBot có giữ tiền mua hàng không?",
                  answer: "Không. Bạn chọn địa chỉ và thanh toán trực tiếp cho Shopee/TikTok Shop. QBot chỉ theo dõi hoa hồng và cộng tiền hoàn sau khi đơn được sàn xác nhận."
                }
              ] as const).map((item) => {
                const expanded = openTrustItem === item.id;
                return (
                  <div key={item.id} className={`overflow-hidden rounded-xl border transition ${expanded ? "border-[#9ec9b9] bg-[#f1f7f4]" : "border-neutral-200 bg-white"}`}>
                    <button type="button" onClick={() => setOpenTrustItem(expanded ? null : item.id)} aria-expanded={expanded} className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 text-left text-sm font-bold">
                      <span>{item.question}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-[#287a63] transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded ? <p className="border-t border-[#d6e4de] px-3.5 py-3 text-sm leading-6 text-neutral-700">{item.answer}</p> : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p><strong>Luôn nhớ:</strong> không cung cấp mật khẩu hoặc OTP của sàn cho bất kỳ ai. Tiền hoàn chỉ được tính khi đơn được ghi nhận và đối soát thành công.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-[#e4e8e6] bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#287a63]">Cách nhận tiền hoàn</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.025em] sm:text-3xl">Làm lần lượt 4 bước là được</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Bạn vẫn chọn sản phẩm và mua hàng như bình thường, QBot chỉ giúp tạo link để theo dõi hoa hồng.</p>
          </div>

          <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "Sao chép link", `Mở sản phẩm trên ${content.label} rồi sao chép đường dẫn.`],
              ["2", "Kiểm tra tiền hoàn", "Dán link vào QBot để xem số tiền hoàn dự kiến."],
              ["3", "Mở link QBot tạo", `Quay lại ${content.label} bằng đúng link QBot gửi.`],
              ["4", "Theo dõi tiền về", "Đơn được sàn ghi nhận, đối soát rồi cộng tiền hoàn."]
            ].map(([number, title, text]) => (
              <li key={number} className="relative rounded-2xl border border-[#dce4e0] bg-[#fafcfb] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#287a63] text-sm font-black text-white">{number}</span>
                <h3 className="mt-3 text-sm font-bold">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-neutral-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#fafaf8] py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#d6e4de] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><Check className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#287a63]">Để đơn dễ được ghi nhận</p>
                <h2 className="mt-1 text-xl font-bold">Nhớ 4 điều nhỏ này</h2>
              </div>
            </div>
            <ul className="mt-5 grid gap-2.5 text-sm leading-6 text-neutral-700">
              {[
                "Mở sản phẩm bằng đúng link QBot vừa tạo.",
                "Nên để giỏ hàng trống trước khi mở link.",
                "Mua trên cùng thiết bị và tài khoản sàn.",
                "Đơn hủy, trả hàng hoặc hoàn tiền sẽ không có tiền hoàn."
              ].map((text) => <li key={text} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-[#287a63]" /><span>{text}</span></li>)}
            </ul>
          </article>

          <article className="rounded-3xl border border-[#d6e4de] bg-[#287a63] p-5 text-white shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15"><ShieldCheck className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/70">QBot làm gì?</p>
                <h2 className="mt-1 text-xl font-bold">Chỉ xử lý link sản phẩm</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 text-sm leading-6 text-white/85">
              <p className="rounded-xl bg-white/10 px-3.5 py-2.5"><strong className="text-white">QBot làm:</strong> kiểm tra link, tạo link mua hàng và theo dõi tiền hoàn.</p>
              <p className="rounded-xl bg-white/10 px-3.5 py-2.5"><strong className="text-white">QBot không làm:</strong> hỏi mật khẩu sàn, đăng nhập thay hoặc nhận tiền mua hàng của bạn.</p>
            </div>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#287a63]">
              Dán link để kiểm tra <ArrowRight className="h-4 w-4" />
            </button>
          </article>
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
                <img src="/images/tutorials/copy-link-shopee.webp" alt="Vị trí nút Chia sẻ và Sao chép đường dẫn trên Shopee" className="mt-3 aspect-[3/2] w-full rounded-xl border border-[#f1d4ca] bg-white object-cover" />
              </article>
              <article className="rounded-2xl border border-[#d7e3e4] bg-[#f6fbfb] p-4">
                <span className="inline-flex rounded-full bg-[#20242a] px-3 py-1 text-xs font-bold text-white">TikTok Shop</span>
                <ol className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700">
                  <li><strong>1.</strong> Từ video hoặc live, mở sản phẩm.</li>
                  <li><strong>2.</strong> Chạm <strong>Chia sẻ</strong>.</li>
                  <li><strong>3.</strong> Chọn <strong>Sao chép liên kết</strong>.</li>
                </ol>
                <img src="/images/tutorials/copy-link-tiktok-shop.webp" alt="Vị trí nút Chia sẻ và Sao chép liên kết trên TikTok Shop" className="mt-3 aspect-[3/2] w-full rounded-xl border border-[#d7e3e4] bg-white object-cover" />
              </article>
            </div>
            <button type="button" onClick={() => setShowGuide(false)} className="mt-4 h-12 w-full rounded-xl bg-[#287a63] text-sm font-bold text-white">Tôi đã sao chép link</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
