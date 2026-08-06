"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight, Check, ChevronDown, ClipboardPaste, Gift, Link2, LoaderCircle,
  LockKeyhole, Mail, ShieldCheck, ShoppingBag, Sparkles, WalletCards, X
} from "lucide-react";
import { classifyShoppingLink } from "@/lib/shopping-link";
import { friendlyRequestError, readApiResponse } from "@/lib/api-response";

type DialogStep = "register" | "verify" | "guide";
type RecentActivity = { id: string; kind: "link" | "withdrawal"; name?: string; platform?: string; amount?: number; createdAt: string; demo?: boolean };

const demoWithdrawals = [
  ["Hoài Thu**", 200000], ["Vân***", 50000], ["Nguyễn Hoa**", 120000], ["Minh Anh**", 80000],
  ["Thu Hà**", 150000], ["Quang Huy**", 110000], ["Ngọc***", 20000], ["Lan Anh**", 90000],
  ["Tuấn***", 75000], ["Hương Giang**", 160000], ["Đức Anh**", 125000], ["Mai***", 40000],
  ["Thanh Tâm**", 175000], ["Khánh Linh**", 95000], ["Phương***", 30000], ["Hải Nam**", 180000],
  ["Thảo Vy**", 60000], ["Bảo***", 65000], ["Kim Oanh**", 105000], ["Trọng Nghĩa**", 135000]
] as const;

function localDemoActivities(): RecentActivity[] {
  const now = Date.now();
  const withdrawals: RecentActivity[] = demoWithdrawals.map(([name, amount], index) => ({
    id: `demo-withdrawal-${index}`,
    kind: "withdrawal",
    name,
    amount,
    createdAt: new Date(now - ((index % 14) + 1) * 60_000).toISOString(),
    demo: true
  }));
  const linkNames = demoWithdrawals.map(([name]) => name);
  const links: RecentActivity[] = Array.from({ length: demoWithdrawals.length * 5 }, (_, index) => ({
    id: `demo-link-${index}`,
    kind: "link",
    name: linkNames[index % linkNames.length],
    platform: index % 3 === 0 ? "TikTok Shop" : "Shopee",
    createdAt: new Date(now - ((index % 14) + 1) * 60_000).toISOString(),
    demo: true
  }));
  const mixed = [...withdrawals, ...links];
  for (let index = mixed.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [mixed[index], mixed[target]] = [mixed[target], mixed[index]];
  }
  return mixed;
}

const steps = [
  { icon: Link2, title: "Dán link sản phẩm", text: "Gửi link Shopee hoặc TikTok Shop cho Em Ry." },
  { icon: ShoppingBag, title: "Mua hàng bình thường", text: "Mở link Qbot tạo và đặt món trên sàn như mọi khi." },
  { icon: WalletCards, title: "Nhận tiền về ví", text: "Khi đơn mua xong và được sàn xác nhận, tiền hoàn sẽ vào ví Qbot." }
];

const trustItems = [
  { icon: Gift, title: "Tiền hoàn từ đâu?", text: "Sàn trả thưởng cho Qbot khi bạn mua qua link. Qbot gửi lại 70% khoản đó cho bạn." },
  { icon: ShieldCheck, title: "Có an toàn không?", text: "Qbot không yêu cầu mật khẩu hay OTP tài khoản Shopee, TikTok Shop." },
  { icon: Check, title: "Có mất phí không?", text: "Không. Đăng ký, tạo link và sử dụng Qbot hoàn toàn miễn phí." }
];

const faqs = [
  ["Bao lâu thì tôi nhận được tiền hoàn?", "Sau khi bạn nhận hàng, sàn cần thêm thời gian kiểm tra đơn. Khi sàn xác nhận, Qbot sẽ cập nhật tiền hoàn cho bạn."],
  ["Đơn hàng nào cũng được hoàn tiền?", "Không phải sản phẩm nào cũng có cùng mức hoàn. Qbot sẽ kiểm tra và báo cho bạn sau khi nhận link."],
  ["Tôi có cần tài khoản mua sắm mới không?", "Không. Bạn vẫn dùng tài khoản Shopee hoặc TikTok Shop hiện tại và mua như bình thường qua link Qbot tạo."],
  ["Nếu đổi trả hoặc hủy đơn thì sao?", "Đơn đã hủy hoặc trả hàng sẽ không có tiền hoàn."],
  ["Tôi rút tiền hoàn bằng cách nào?", "Khi tiền đã vào ví và đủ mức rút, bạn có thể yêu cầu chuyển tiền ngay trong Qbot."]
];

function registrationAttemptId() {
  const current = sessionStorage.getItem("registration_attempt_id");
  if (current) return current;
  const next = crypto.randomUUID();
  sessionStorage.setItem("registration_attempt_id", next);
  return next;
}

function activityTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `cách đây ${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  return `cách đây ${hours} giờ`;
}

export function FacebookConversionFlow() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [productLink, setProductLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [showLinkGuide, setShowLinkGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<"shopee" | "tiktok">("shopee");
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [showActivity, setShowActivity] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dialogOpen) return;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => emailInput.current?.focus(), 120);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) setDialogOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = ""; window.clearTimeout(timer); window.removeEventListener("keydown", closeOnEscape); };
  }, [dialogOpen, loading]);

  useEffect(() => {
    fetch("/api/activity/recent", { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        const real = Array.isArray(data.activities) ? data.activities as RecentActivity[] : [];
        setActivities(process.env.NODE_ENV === "development" ? [...real, ...localDemoActivities()] : real);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activities.length || dialogOpen) { setShowActivity(false); return; }
    const first = window.setTimeout(() => setShowActivity(true), 3500);
    const cycle = window.setInterval(() => {
      setShowActivity(false);
      window.setTimeout(() => {
        setActivityIndex(index => (index + 1) % activities.length);
        setShowActivity(true);
      }, 500);
    }, 9000);
    return () => { window.clearTimeout(first); window.clearInterval(cycle); };
  }, [activities, dialogOpen]);

  function openRegister() {
    setError("");
    setDialogStep("register");
    setDialogOpen(true);
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Bạn kiểm tra lại địa chỉ email.");
    if (password.length < 8) return setError("Mật khẩu cần có ít nhất 8 ký tự.");
    if (!passwordConfirmed) return setError("Vui lòng tích chọn “Tôi chắc chắn mật khẩu đã đúng như mong muốn” để tiếp tục đăng ký.");
    setLoading(true);
    try {
      const response = await fetch("/api/chat/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          email: email.trim().toLowerCase(),
          password,
          passwordConfirmation: password,
          registrationPath: window.location.pathname,
          registrationContext: "LINK_REGISTER",
          registrationAttemptId: registrationAttemptId()
        })
      });
      const data = await readApiResponse(response, "Chưa thể đăng ký tài khoản.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Chưa thể đăng ký tài khoản.");
      if (typeof data.id !== "string") throw new Error("Chưa thể đăng nhập tài khoản mới. Bạn vui lòng thử lại.");
      localStorage.setItem("chat_session_id", data.id);
      setSessionId(data.id);
      if (data.authChallenge === "verify-email") {
        setDialogStep("verify");
        return;
      }
      if (!data.user) throw new Error("Tài khoản chưa được tạo xong. Bạn vui lòng thử lại.");
      setDialogStep("guide");
    } catch (registerError) {
      setError(friendlyRequestError(registerError, "Chưa thể đăng ký. Bạn thử lại nhé."));
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmail(event: FormEvent) {
    event.preventDefault();
    if (verificationCode.trim().length < 4) return setError("Bạn nhập mã xác minh trong email.");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/chat/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "verify-email", sessionId, code: verificationCode.trim() })
      });
      const data = await readApiResponse(response, "Mã xác minh chưa đúng.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Mã xác minh chưa đúng.");
      if (!data.user) throw new Error("Tài khoản chưa được xác minh thành công.");
      if (typeof data.id === "string") localStorage.setItem("chat_session_id", data.id);
      setDialogStep("guide");
    } catch (verifyError) {
      setError(friendlyRequestError(verifyError, "Chưa thể xác minh email."));
    } finally {
      setLoading(false);
    }
  }

  function goToBot(event?: FormEvent) {
    event?.preventDefault();
    setLinkError("");
    const classified = classifyShoppingLink(productLink.trim());
    if (classified.kind !== "supported") {
      setLinkError("Hãy dán đúng link sản phẩm Shopee hoặc TikTok Shop.");
      return;
    }
    localStorage.setItem("pending_cashback_link", classified.url);
    window.location.assign("/tro-ly");
  }

  async function pasteProductLink() {
    setLinkError("");
    try {
      const value = (await navigator.clipboard.readText()).trim();
      if (!value) return setLinkError("Bạn chưa sao chép link sản phẩm nào.");
      setProductLink(value);
      const classified = classifyShoppingLink(value);
      if (classified.kind === "supported") {
        localStorage.setItem("pending_cashback_link", classified.url);
        window.setTimeout(() => window.location.assign("/tro-ly"), 350);
      }
    } catch {
      setLinkError("Bạn nhấn giữ trong ô rồi chọn Dán nhé.");
    }
  }

  const currentActivity = activities[activityIndex];
  const shopeeActivity = currentActivity?.kind === "link" && currentActivity.platform === "Shopee";
  const activityTone = shopeeActivity
    ? "border-[#f3a18f] border-r-[#ee4d2d]"
    : "border-[#9fcabb] border-r-[#287a63]";
  const activityIconTone = shopeeActivity
    ? "bg-[#fff0ec] text-[#ee4d2d] ring-[#fff7f4]"
    : "bg-[#e8f3ef] text-[#287a63] ring-[#f3f8f5]";

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#fafaf8] font-sans text-[#30343b] [text-wrap:pretty]">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[radial-gradient(circle_at_88%_18%,rgba(40,122,99,.13),transparent_30%),radial-gradient(circle_at_8%_82%,rgba(198,167,106,.14),transparent_28%),linear-gradient(180deg,#fafaf8_0%,#fff_100%)]">
        <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/api/site-assets/logo" alt="Qbot.vn" className="h-10 w-10 rounded-xl border border-[#d9dde3] bg-white object-cover shadow-sm" />
            <strong className="text-xl tracking-[-.04em]">Qbot.vn</strong>
          </a>
          <a href="/tro-ly?auth=login" className="text-xs font-bold text-[#287a63] sm:text-sm">Đã có tài khoản?</a>
        </header>

        <div className="relative z-[1] mx-auto grid w-full max-w-6xl flex-1 items-center gap-9 px-4 pb-14 pt-5 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:gap-14 lg:py-12">
          <div className="min-w-0 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e4de] bg-white/80 px-3 py-2 text-[11px] font-bold text-[#287a63] shadow-sm"><Sparkles className="h-4 w-4" /> Mua sắm thông minh hơn cùng Em Ry</span>
            <h1 className="mt-5 text-[clamp(38px,11vw,68px)] font-extrabold leading-[1.08] tracking-[-.04em]">
              <span className="block text-[.67em] tracking-[-.035em] text-[#4b5753]">Mua hàng trên</span>
              <span className="mt-1 block whitespace-nowrap text-[.76em] lg:text-[.84em]"><span className="text-[#ee4d2d]">Shopee</span><span>, TikTok Shop</span></span>
              <span className="mx-auto mt-2 block w-max max-w-full text-[.92em] text-[#287a63] lg:mx-0">Nhận lại tiền</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg lg:mx-0">Đăng ký Qbot, gửi link món bạn muốn mua cho Em Ry rồi đặt hàng như bình thường. Khi đơn được xác nhận, bạn nhận lại 70% khoản thưởng từ sàn.</p>
            <button type="button" onClick={openRegister} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(40,122,99,.25)] transition hover:bg-[#216653] sm:w-auto sm:text-base">Bắt đầu nhận tiền hoàn <ArrowRight className="h-5 w-5" /></button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500 lg:justify-start"><Check className="h-4 w-4 text-[#287a63]" /> Đăng ký miễn phí trong 15 giây</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Miễn phí", "Không cần mật khẩu sàn", "Bảo mật"].map(item => <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e7e1] bg-white/80 px-3 py-2 text-[11px] font-bold text-[#52625d]"><Check className="h-3.5 w-3.5 text-[#287a63]" />{item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px] rounded-[28px] border border-[#d9e7e1] bg-white/95 p-5 shadow-[0_24px_70px_rgba(31,78,63,.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5"><img src="/api/site-assets/logo" alt="Em Ry" className="h-11 w-11 rounded-2xl border object-cover" /><div><strong className="block text-sm">Em Ry · Qbot</strong><span className="text-[11px] text-neutral-500">Sẵn sàng tính tiền hoàn</span></div></div>
              <span className="rounded-full bg-[#e8f3ef] px-2.5 py-1 text-[10px] font-black text-[#287a63]">DEMO</span>
            </div>
            <div className="mt-4 grid grid-cols-[76px_1fr] gap-3 rounded-2xl border border-neutral-200 bg-[#fafaf8] p-3 text-left">
              <span className="grid aspect-square place-items-center rounded-xl bg-[#e8f3ef] text-[#287a63]"><ShoppingBag className="h-8 w-8" /></span>
              <div className="min-w-0"><strong className="block text-sm">Sản phẩm bạn yêu thích</strong><span className="mt-1 block text-xs text-neutral-500">Giá sản phẩm</span><b className="mt-1 block text-lg">599.000đ</b></div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#d6e4de] bg-[#edf7f3] p-4 text-[#216653]"><span className="text-xs font-bold">Có thể được hoàn</span><strong className="text-2xl tracking-[-.04em]">+42.700đ</strong></div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e5ebe8] bg-white py-9">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6"><p className="text-sm text-neutral-600"><strong className="text-base text-[#30343b]">Mỗi đơn hàng đều rõ ràng</strong> · Theo dõi trạng thái và tiền hoàn ngay trong Qbot</p></div>
      </section>

      <section className="bg-[#f3f8f5] py-16 sm:py-24" id="cach-hoat-dong">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#287a63]">Chỉ 3 bước</p><h2 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-4xl">Mua như mọi ngày, có thêm tiền hoàn</h2><p className="mt-3 text-[15px] leading-6 text-neutral-600 sm:text-base">Bạn vẫn mua hàng như trước. Chỉ cần mở link do Qbot tạo trước khi đặt hàng.</p></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {steps.map((item, index) => { const Icon = item.icon; return <article key={item.title} className="grid grid-cols-[52px_1fr] items-center gap-x-4 rounded-2xl border border-[#d9e7e1] bg-white p-4 text-left md:block md:p-6"><span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#e8f3ef] text-[#287a63] md:mb-4"><Icon className="h-6 w-6" /></span><div><div className="flex items-center justify-between gap-2"><h3 className="font-black">{item.title}</h3><b className="text-lg text-[#d1ddd8]">0{index + 1}</b></div><p className="mt-1 text-[13px] leading-5 text-neutral-600">{item.text}</p></div></article>; })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#287a63]">Dễ hiểu, dễ dùng</p><h2 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-4xl">An tâm với từng đơn hàng</h2></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {trustItems.map(item => { const Icon = item.icon; return <article key={item.title} className="grid grid-cols-[44px_1fr] items-center gap-x-4 rounded-2xl border border-[#e1e7e4] bg-[#fafaf8] p-4 text-left md:block md:p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ef] text-[#287a63] md:mb-4"><Icon className="h-5 w-5" /></span><div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-[13px] leading-5 text-neutral-600">{item.text}</p></div></article>; })}
          </div>
        </div>
      </section>

      <section className="bg-[#f3f8f5] py-16 sm:py-24" id="faq">
        <div className="mx-auto max-w-3xl px-4 sm:px-6"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#287a63]">Câu hỏi thường gặp</p><h2 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-4xl">Bạn muốn biết thêm?</h2></div><div className="mt-8 border-t border-[#d5e1dc]">{faqs.map(([question, answer], index) => <div key={question} className="border-b border-[#d5e1dc]"><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex min-h-16 w-full items-center justify-between gap-5 py-4 text-left text-[15px] font-bold leading-6"><span>{question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-[#287a63] transition ${openFaq === index ? "rotate-180" : ""}`} /></button>{openFaq === index ? <p className="pb-5 pr-8 text-[15px] leading-6 text-neutral-600">{answer}</p> : null}</div>)}</div></div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-[#287a63] px-5 py-11 text-center text-white shadow-[0_20px_55px_rgba(40,122,99,.22)] sm:px-12"><h2 className="text-3xl font-black tracking-[-.035em]">Đừng bỏ lỡ tiền hoàn ở lần mua tiếp theo</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#dcebe6]">Tạo tài khoản miễn phí, gửi link cho Em Ry và bắt đầu mua sắm có hoàn tiền.</p><button type="button" onClick={openRegister} className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 text-sm font-black text-[#287a63]">Bắt đầu nhận tiền hoàn <ArrowRight className="h-5 w-5" /></button></div></section>

      <footer className="border-t border-neutral-200 bg-white px-4 py-7 text-xs text-neutral-500"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4"><span>© 2026 Qbot.vn · Em Ry</span><div className="flex gap-4"><a href="/thong-tin/dieu-khoan-dich-vu">Điều khoản</a><a href="/thong-tin/chinh-sach-bao-mat">Quyền riêng tư</a></div></div></footer>

      {currentActivity ? (
        <div aria-live="polite" className={`pointer-events-none fixed bottom-20 right-3 z-20 max-w-[calc(100%-24px)] transition duration-300 md:bottom-5 md:right-5 ${showActivity && !dialogOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          <div className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border border-r-4 bg-white px-4 py-3 shadow-[0_16px_45px_rgba(31,78,63,.24)] ${activityTone}`}>
            <span className={`absolute right-2 top-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${shopeeActivity ? "text-[#ee4d2d]" : "text-[#287a63]"}`}>
              <i className={`h-1.5 w-1.5 animate-pulse rounded-full ${shopeeActivity ? "bg-[#ee4d2d]" : "bg-[#287a63]"}`} />
              {currentActivity.demo && currentActivity.kind === "withdrawal" ? "Yêu cầu mới" : "Hoạt động mới"}
            </span>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ring-4 ${activityIconTone}`}>
              {currentActivity.kind === "withdrawal" ? <WalletCards className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
            </span>
            <div className="min-w-0 pr-12">
              <p className="text-[13px] font-bold leading-5 text-[#30343b]">
                {currentActivity.kind === "withdrawal"
                  ? `${currentActivity.name || "Người dùng Qbot"} vừa yêu cầu rút${currentActivity.amount ? ` ${currentActivity.amount.toLocaleString("vi-VN")} VNĐ` : " tiền"}`
                  : `${currentActivity.name || "Người dùng Qbot"} vừa tạo link${currentActivity.platform ? ` ${currentActivity.platform}` : " mua hàng"}`}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-neutral-500">{activityTime(currentActivity.createdAt)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d9e7e1] bg-white/95 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur md:hidden"><button type="button" onClick={openRegister} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#287a63] text-sm font-black text-white">Bắt đầu nhận tiền hoàn <ArrowRight className="h-5 w-5" /></button></div>

      {dialogOpen ? <div role="dialog" aria-modal="true" aria-label="Đăng ký Qbot" onMouseDown={event => { if (event.target === event.currentTarget && !loading) setDialogOpen(false); }} className="fixed inset-0 z-50 grid place-items-end bg-black/50 sm:place-items-center sm:p-4">
        <div className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
          <div className="flex items-start justify-between"><div><span className="inline-flex rounded-full bg-[#e8f3ef] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#287a63]">{dialogStep === "register" ? "Miễn phí · 15 giây" : dialogStep === "verify" ? "Xác minh tài khoản" : "Đăng ký thành công"}</span><h2 className="mt-3 text-2xl font-black tracking-[-.03em]">{dialogStep === "register" ? "Bắt đầu cùng Em Ry" : dialogStep === "verify" ? "Kiểm tra email của bạn" : "Lấy link sản phẩm bạn muốn mua"}</h2></div><button type="button" disabled={loading} onClick={() => setDialogOpen(false)} aria-label="Đóng" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500"><X className="h-5 w-5" /></button></div>

          {dialogStep === "register" ? <form onSubmit={register} className="mt-5">
            <p className="mb-4 text-[15px] leading-6 text-neutral-600">Tạo tài khoản Qbot để lưu đơn hàng và tiền hoàn của bạn.</p>
            <label className="text-sm font-bold" htmlFor="fb-email">Email của bạn</label><div className="relative mt-1.5"><Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" /><input ref={emailInput} id="fb-email" required type="email" inputMode="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="Ví dụ: ban@gmail.com" className="h-14 w-full rounded-xl border border-neutral-200 pl-11 pr-3 text-base outline-none focus:border-[#287a63] focus:ring-4 focus:ring-[#e8f3ef]" /></div>
            <label className="mt-4 block text-sm font-bold" htmlFor="fb-password">Mật khẩu bạn muốn đặt</label><div className="relative mt-1.5"><LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" /><input id="fb-password" required minLength={8} type="text" value={password} onChange={event => { setPassword(event.target.value); setPasswordConfirmed(false); }} autoComplete="off" spellCheck={false} placeholder="Nhập ít nhất 8 ký tự" className="h-14 w-full rounded-xl border border-neutral-200 pl-11 pr-3 text-base outline-none focus:border-[#287a63] focus:ring-4 focus:ring-[#e8f3ef]" /></div>
            <p className="mt-1.5 text-[11px] text-neutral-500">Mật khẩu đang được hiển thị để bạn kiểm tra trước khi đăng ký.</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#d9e7e1] bg-[#f3f8f5] p-3 text-xs font-semibold leading-5 text-[#3f514b]"><input type="checkbox" checked={passwordConfirmed} onChange={event => { setPasswordConfirmed(event.target.checked); if (event.target.checked) setError(""); }} className="mt-0.5 h-4 w-4 shrink-0 accent-[#287a63]" /><span>Tôi chắc chắn mật khẩu đã đúng như mong muốn</span></label>
            {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p> : null}
            <button disabled={loading} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] text-sm font-black text-white disabled:opacity-60">{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}{loading ? "Đang tạo tài khoản..." : "Đăng ký miễn phí"}</button>
            <p className="mt-3 text-center text-[11px] leading-5 text-neutral-500">Bằng việc đăng ký, bạn đồng ý với <a className="font-bold underline" href="/thong-tin/dieu-khoan-dich-vu" target="_blank">Điều khoản</a> và <a className="font-bold underline" href="/thong-tin/chinh-sach-bao-mat" target="_blank">Chính sách bảo mật</a>.</p>
          </form> : null}

          {dialogStep === "verify" ? <form onSubmit={verifyEmail} className="mt-5"><p className="text-sm leading-6 text-neutral-600">Qbot đã gửi mã xác minh tới <strong>{email}</strong>. Nhập mã để hoàn tất tài khoản.</p><input required autoFocus inputMode="numeric" value={verificationCode} onChange={event => setVerificationCode(event.target.value)} placeholder="Nhập mã xác minh" className="mt-4 h-14 w-full rounded-xl border border-neutral-200 px-4 text-center text-lg font-bold tracking-[.16em] outline-none focus:border-[#287a63]" />{error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p> : null}<button disabled={loading} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] text-sm font-black text-white disabled:opacity-60">{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}Xác minh và tiếp tục</button></form> : null}

          {dialogStep === "guide" ? <div className="mt-5"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e8f3ef] text-[#287a63]"><Check className="h-7 w-7" /></div><p className="mt-3 text-center text-[15px] leading-6 text-neutral-600">Tài khoản đã tạo xong. Bây giờ bạn hãy lấy link của món muốn mua.</p><ol className="mt-5 grid gap-2 text-[15px]"><li className="flex gap-3 rounded-xl bg-[#f3f8f5] p-3"><b className="text-[#287a63]">1</b><span>Mở món bạn muốn mua trên Shopee hoặc TikTok Shop.</span></li><li className="flex gap-3 rounded-xl bg-[#f3f8f5] p-3"><b className="text-[#287a63]">2</b><span>Bấm <strong>Chia sẻ</strong>, sau đó chọn <strong>Sao chép liên kết</strong>.</span></li><li className="flex gap-3 rounded-xl bg-[#f3f8f5] p-3"><b className="text-[#287a63]">3</b><span>Quay lại đây và dán link vào ô bên dưới.</span></li></ol>
            <button type="button" onClick={() => setShowLinkGuide(value => !value)} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl border border-[#b8d8cc] bg-[#f3f8f5] px-4 text-left text-sm font-black text-[#287a63]"><span className="inline-flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Xem hướng dẫn bằng hình ảnh</span><ChevronDown className={`h-5 w-5 transition ${showLinkGuide ? "rotate-180" : ""}`} /></button>
            {showLinkGuide ? <div className="mt-3 rounded-2xl border border-[#d9e7e1] bg-[#fafaf8] p-3"><div className="grid grid-cols-2 rounded-xl bg-[#e8eeeb] p-1 text-xs font-bold"><button type="button" onClick={() => setGuidePlatform("shopee")} className={`min-h-10 rounded-lg transition ${guidePlatform === "shopee" ? "bg-white text-[#ee4d2d] shadow-sm" : "text-neutral-500"}`}>Shopee</button><button type="button" onClick={() => setGuidePlatform("tiktok")} className={`min-h-10 rounded-lg transition ${guidePlatform === "tiktok" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>TikTok Shop</button></div><img src={guidePlatform === "shopee" ? "/images/tutorials/copy-link-shopee.webp" : "/images/tutorials/copy-link-tiktok-shop.webp"} alt={`Hướng dẫn sao chép link ${guidePlatform === "shopee" ? "Shopee" : "TikTok Shop"}`} className="mt-3 aspect-[3/2] w-full rounded-xl border border-neutral-200 bg-white object-cover" /><p className="mt-2 text-center text-[11px] text-neutral-500">Mở sản phẩm → Chia sẻ → Sao chép liên kết</p></div> : null}
            <form onSubmit={goToBot} className="mt-4"><label htmlFor="fb-product-link" className="text-xs font-black">Rồi dán vào đây</label><div className="relative mt-2"><Link2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" /><input id="fb-product-link" autoFocus value={productLink} onChange={event => { setProductLink(event.target.value); setLinkError(""); }} onPaste={event => { const value = event.clipboardData.getData("text").trim(); const classified = classifyShoppingLink(value); if (classified.kind === "supported") { localStorage.setItem("pending_cashback_link", classified.url); window.setTimeout(() => window.location.assign("/tro-ly"), 250); } }} placeholder="https://shopee.vn/..." className="h-14 w-full rounded-xl border border-neutral-200 pl-11 pr-20 text-base outline-none focus:border-[#287a63]" /><button type="button" onClick={() => void pasteProductLink()} className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-[#e8f3ef] px-3 text-xs font-black text-[#287a63]"><ClipboardPaste className="mr-1 inline h-4 w-4" />Dán</button></div>{linkError ? <p className="mt-2 text-xs font-semibold text-red-700">{linkError}</p> : null}<button className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] text-sm font-black text-white">Mở Em Ry và tạo link <ArrowRight className="h-5 w-5" /></button></form></div> : null}
        </div>
      </div> : null}
    </main>
  );
}
