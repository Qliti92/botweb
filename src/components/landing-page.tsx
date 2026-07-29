"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardPaste,
  Clock3,
  ExternalLink,
  HelpCircle,
  Link2,
  LogIn,
  Menu,
  PackageCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  WalletCards,
  X
} from "lucide-react";
import { classifyShoppingLink } from "@/lib/shopping-link";

type LandingPageProps = {
  onLogin: () => void;
  onRegister: () => void;
};

const steps = [
  {
    icon: ClipboardPaste,
    title: "Dán link sản phẩm",
    text: "Sao chép link sản phẩm trên Shopee hoặc TikTok Shop rồi dán vào Qbot."
  },
  {
    icon: UserPlus,
    title: "Tạo tài khoản miễn phí",
    text: "Tài khoản giúp Qbot ghi nhận đơn hàng và tiền hoàn đúng cho bạn."
  },
  {
    icon: ShoppingBag,
    title: "Mở link Qbot tạo",
    text: "Quay lại Shopee hoặc TikTok Shop bằng đúng link và mua hàng như bình thường."
  },
  {
    icon: WalletCards,
    title: "Theo dõi và nhận tiền hoàn",
    text: "Sau khi đơn được ghi nhận, bạn có thể xem trạng thái và tiền hoàn trong tài khoản."
  }
];

const notices = [
  "Mở sản phẩm và đặt hàng từ đúng link Ry gửi lại.",
  "Nên hoàn tất việc mua hàng trên cùng một thiết bị và tài khoản.",
  "Tiền hoàn được xác nhận sau khi đơn hàng hoàn tất và được sàn đối soát.",
  "Đơn bị hủy, trả hàng hoặc hoàn tiền sẽ không đủ điều kiện nhận tiền hoàn."
];

const faqs = [
  {
    question: "Tôi có phải trả phí đăng ký không?",
    answer: "Không. Đăng ký tài khoản và sử dụng Ry hoàn toàn miễn phí, không có phí mở tài khoản."
  },
  {
    question: "Hoa hồng của tôi được tính như thế nào?",
    answer: "Bạn nhận 70% số hoa hồng còn lại sau thuế. Công thức là: (Hoa hồng được sàn xác nhận − thuế theo quy định) × 70%. Mức hoa hồng phụ thuộc từng sản phẩm và kết quả đối soát của sàn."
  },
  {
    question: "Bao lâu thì đơn hàng được ghi nhận?",
    answer: "Đơn hàng cần thời gian để sàn cập nhật và đối soát. Bạn có thể mở mục Đơn hàng trong Ry để kiểm tra trạng thái mới nhất."
  },
  {
    question: "Tại sao tôi phải mua qua link Ry tạo?",
    answer: "Link này giúp hệ thống nhận biết đơn hàng của bạn. Nếu mua bằng link khác, đơn có thể không được ghi nhận để hoàn tiền."
  },
  {
    question: "Khi nào tôi có thể rút tiền?",
    answer: "Bạn có thể yêu cầu rút tiền về tài khoản ngân hàng khi tiền hoàn đã được cộng vào tài khoản và số dư trên 10.000đ. Yêu cầu rút tiền sẽ được xử lý trong vòng 1–24 giờ."
  }
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [linkGuideTab, setLinkGuideTab] = useState<"shopee" | "tiktok">("shopee");
  const [showLinkGuide, setShowLinkGuide] = useState(false);
  const [productLink, setProductLink] = useState("");
  const [productLinkError, setProductLinkError] = useState("");

  function startWithProductLink(event: FormEvent) {
    event.preventDefault();
    setProductLinkError("");
    const link = classifyShoppingLink(productLink);
    if (link.kind !== "supported") {
      setProductLinkError("Bạn hãy dán đầy đủ link sản phẩm Shopee hoặc TikTok Shop.");
      return;
    }
    window.localStorage.setItem("pending_cashback_link", link.url);
    onRegister();
  }

  async function pasteProductLink() {
    setProductLinkError("");
    try {
      const value = await navigator.clipboard.readText();
      setProductLink(value.trim());
    } catch {
      setProductLinkError("Bạn nhấn giữ trong ô rồi chọn Dán, hoặc dùng Ctrl+V.");
    }
  }

  return (
    <main className="landing-page metal-theme min-h-dvh overflow-hidden bg-[#fafaf8] pb-20 text-[#30343b] sm:pb-0">
      <header className="safe-top sticky top-0 z-40 border-b border-[#e4e6e9] bg-[#fafaf8]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:min-h-16 sm:px-6">
          <a href="#trang-chu" className="flex min-w-0 flex-1 items-center gap-2.5">
            <img src="/api/site-assets/logo" alt="Hoàn Tiền Mua Hàng" className="h-9 w-9 shrink-0 rounded-full bg-white object-cover ring-1 ring-[#d9dde3] sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <strong className="block truncate text-[13px] sm:text-sm">
                <span className="sm:hidden">Qbot</span>
                <span className="hidden sm:inline">Hoàn Tiền Mua Hàng</span>
              </strong>
              <span className="hidden text-[10px] text-neutral-500 sm:block">Em Ry · Trợ lý hoàn tiền</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-xs font-medium text-neutral-600 md:flex">
            <a href="#cach-hoat-dong" className="transition hover:text-[#287a63]">Cách hoạt động</a>
            <button type="button" onClick={() => setShowLinkGuide(true)} className="transition hover:text-[#287a63]">Cách lấy link</button>
            <a href="#luu-y" className="transition hover:text-[#287a63]">Lưu ý</a>
            <a href="#cau-hoi" className="transition hover:text-[#287a63]">Câu hỏi thường gặp</a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button onClick={onLogin} aria-label="Đăng nhập" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold transition hover:bg-[#f1f3f4] sm:h-11 sm:w-auto sm:gap-1.5 sm:px-2.5">
              <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Đăng nhập</span>
            </button>
            <button onClick={onRegister} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#287a63] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#216653] sm:h-11 sm:px-3.5">
              <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Bắt đầu miễn phí</span><span className="sm:hidden">Đăng ký</span>
            </button>
          </div>
        </div>
      </header>

      <section id="trang-chu" className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(40,122,99,.10),transparent_28%),radial-gradient(circle_at_88%_75%,rgba(198,167,106,.14),transparent_30%)]" />
        <div className="relative mx-auto grid w-full min-w-0 max-w-6xl items-center gap-7 px-4 pb-10 pt-6 sm:min-h-[650px] sm:gap-9 sm:px-6 sm:py-14 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
          <div className="min-w-0 text-center lg:text-left">
            <span className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border border-[#d6e4de] bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-[#287a63] shadow-sm sm:gap-2 sm:py-2 sm:text-[11px]">
              <Check className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Kiểm tra miễn phí · Mua sắm trên sàn
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-[clamp(30px,9vw,48px)] font-bold leading-[1.08] tracking-[-.035em] sm:mt-5 sm:leading-[1.14] lg:mx-0">
              <span className="block sm:whitespace-nowrap">Dán link sản phẩm</span>
              <span className="mt-1 block sm:whitespace-nowrap text-[#287a63]">kiểm tra tiền hoàn.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-6 text-neutral-600 sm:mt-5 sm:text-[16px] sm:leading-[1.7] lg:mx-0">
              Sao chép link sản phẩm Shopee hoặc TikTok Shop, dán vào Qbot để tạo link mua hàng và theo dõi tiền hoàn của bạn.
            </p>

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#d6e4de] bg-white p-3.5 text-left shadow-[0_18px_50px_rgba(48,52,59,.10)] sm:mt-6 sm:p-5 lg:mx-0">
              <form onSubmit={startWithProductLink}>
                <label htmlFor="home-product-link" className="text-sm font-bold">Dán link sản phẩm để bắt đầu</label>
                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Link2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="home-product-link"
                      value={productLink}
                      onChange={(event) => { setProductLink(event.target.value); setProductLinkError(""); }}
                      placeholder="Link Shopee hoặc TikTok Shop"
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 pr-20 text-sm outline-none focus:border-[#287a63] focus:bg-white sm:h-14"
                    />
                    <button type="button" onClick={() => void pasteProductLink()} className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1 rounded-lg bg-[#e8f3ef] px-2.5 text-xs font-bold text-[#287a63] hover:bg-[#dcece6]">
                      <ClipboardPaste className="h-3.5 w-3.5" /> Dán
                    </button>
                  </div>
                  <button type="submit" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white hover:bg-[#216653] sm:h-14">
                    <span className="sm:hidden">Kiểm tra ngay</span>
                    <span className="hidden sm:inline">Kiểm tra tiền hoàn</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                {productLinkError ? <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{productLinkError}</p> : null}
                <button type="button" onClick={() => setShowLinkGuide(true)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#9ec9b9] bg-[#f1f7f4] px-4 text-sm font-bold text-[#287a63] transition hover:border-[#287a63] hover:bg-[#e4f1ec]">
                  <HelpCircle className="h-5 w-5" /> Chưa biết lấy link? Xem hướng dẫn
                </button>
              </form>

              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-4 text-neutral-500">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#287a63]" />
                Cần tài khoản miễn phí để ghi nhận đơn và tiền hoàn đúng cho bạn. Không cần mật khẩu hoặc OTP của sàn.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-neutral-500 lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#287a63]" /> Chỉ mất vài phút</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#287a63]" /> Thông tin được bảo vệ</span>
            </div>
          </div>

          <CashbackOutcomePreview />
        </div>
      </section>

      <section id="cach-hoat-dong" className="scroll-mt-20 border-y border-[#e7e9ed] bg-white py-10 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Rất dễ sử dụng" title="Từ link sản phẩm đến tiền hoàn" description="Qbot giúp bạn tạo đúng link mua hàng, theo dõi đơn và tiền hoàn trong một tài khoản." />

          <div className="relative mx-auto mt-7 max-w-md sm:hidden">
            <span className="absolute bottom-8 left-[23px] top-8 w-0.5 bg-[#d6e4de]" aria-hidden="true" />
            <ol className="relative grid gap-2">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="flex items-start gap-3 rounded-2xl bg-[#fafaf8] p-3">
                  <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-white bg-[#287a63] text-sm font-black text-white shadow-sm">{index + 1}</span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-[#287a63]" />
                      <h3 className="text-[15px] font-bold leading-5">{title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-[1.15rem] text-neutral-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mt-10 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="relative rounded-2xl border border-[#dfe2e6] bg-[#fafaf8] p-5 shadow-sm">
                <span className="absolute right-4 top-4 text-4xl font-black text-[#e1e9e6]">{index + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#eaf4f0] text-[#287a63]"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 pr-6 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
                {index < steps.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 rounded-full bg-white p-1 text-[#287a63] shadow lg:block" /> : null}
              </article>
            ))}
          </div>
          <div className="mt-6 text-center sm:mt-8">
            <a href="#trang-chu" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-semibold text-white hover:bg-[#216653] sm:w-auto">
              Dán link để bắt đầu <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {showLinkGuide ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Cách sao chép đường dẫn sản phẩm" onClick={() => setShowLinkGuide(false)}>
          <section className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-[#fafaf8] shadow-2xl sm:max-w-4xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setShowLinkGuide(false)} className="sticky right-4 top-4 z-10 ml-auto mr-4 mt-4 grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm" aria-label="Đóng hướng dẫn"><X className="h-5 w-5" /></button>
            <div className="-mt-8 px-4 pb-6 pt-3 sm:px-7 sm:pb-8">
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#287a63] sm:text-[10px]">Hướng dẫn trên điện thoại</span>
                <h2 className="mt-1 whitespace-nowrap text-[clamp(16px,4.7vw,24px)] font-bold leading-tight tracking-[-.025em] sm:mt-2 sm:text-[30px]">Cách sao chép đường dẫn sản phẩm</h2>
                <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-neutral-600 sm:mt-3 sm:text-sm sm:leading-6">Mở đúng sản phẩm, làm theo hai thao tác dưới đây rồi quay lại dán link cho Ry.</p>
              </div>

          <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 rounded-2xl bg-[#eceeed] p-1.5" role="tablist" aria-label="Chọn ứng dụng cần xem hướng dẫn">
            <button
              type="button"
              role="tab"
              aria-selected={linkGuideTab === "shopee"}
              aria-controls="link-guide-panel"
              onClick={() => setLinkGuideTab("shopee")}
              className={`min-h-12 rounded-xl px-3 text-sm font-bold transition ${linkGuideTab === "shopee" ? "bg-[#ee4d2d] text-white shadow-sm" : "text-neutral-600 hover:bg-white/70"}`}
            >
              Shopee
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={linkGuideTab === "tiktok"}
              aria-controls="link-guide-panel"
              onClick={() => setLinkGuideTab("tiktok")}
              className={`min-h-12 rounded-xl px-3 text-sm font-bold transition ${linkGuideTab === "tiktok" ? "bg-[#20242a] text-white shadow-sm" : "text-neutral-600 hover:bg-white/70"}`}
            >
              TikTok Shop
            </button>
          </div>

          <div id="link-guide-panel" role="tabpanel" className="mx-auto mt-6 max-w-4xl">
            {linkGuideTab === "shopee" ? (
              <article className="overflow-hidden rounded-3xl border border-[#efd9cf] bg-white shadow-[0_14px_40px_rgba(48,52,59,.07)]">
                <div className="border-b border-[#f0e2dc] bg-[#fff8f4] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ee4d2d] text-lg font-black text-white">S</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#a93616]">Trên ứng dụng Shopee</p>
                      <h3 className="mt-1 text-xl font-bold">Sao chép link trong 2 bước</h3>
                    </div>
                  </div>
                  <ol className="mt-5 grid gap-3 text-sm leading-6 text-neutral-700 sm:grid-cols-2">
                    <li className="flex gap-3"><StepBadge value="1" tone="orange" /><span>Mở trang sản phẩm muốn mua, chạm biểu tượng <strong>Chia sẻ</strong> ở góc trên bên phải.</span></li>
                    <li className="flex gap-3"><StepBadge value="2" tone="orange" /><span>Trong bảng hiện ra, chạm <strong>Sao chép đường dẫn</strong>.</span></li>
                  </ol>
                </div>
                <img src="/images/tutorials/copy-link-shopee.webp" alt="Minh họa hai bước sao chép đường dẫn sản phẩm trên ứng dụng Shopee" className="aspect-[3/2] h-auto w-full object-cover" />
              </article>
            ) : (
              <article className="overflow-hidden rounded-3xl border border-[#d5e5e8] bg-white shadow-[0_14px_40px_rgba(48,52,59,.07)]">
                <div className="border-b border-[#dcebed] bg-[#f5fbfc] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#20242a] text-lg font-black text-white ring-2 ring-[#20c8d4]/30">T</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#16717c]">Trên ứng dụng TikTok Shop</p>
                      <h3 className="mt-1 text-xl font-bold">Sao chép link trong 2 bước</h3>
                    </div>
                  </div>
                  <ol className="mt-5 grid gap-3 text-sm leading-6 text-neutral-700 sm:grid-cols-2">
                    <li className="flex gap-3"><StepBadge value="1" tone="cyan" /><span>Mở sản phẩm muốn mua, chạm biểu tượng mũi tên <strong>Chia sẻ</strong> ở phía trên màn hình.</span></li>
                    <li className="flex gap-3"><StepBadge value="2" tone="cyan" /><span>Trong bảng chia sẻ, chạm <strong>Sao chép Liên kết</strong>.</span></li>
                  </ol>
                </div>
                <img src="/images/tutorials/copy-link-tiktok-shop.webp" alt="Minh họa hai bước sao chép liên kết sản phẩm trên ứng dụng TikTok Shop" className="aspect-[3/2] h-auto w-full object-cover" />
              </article>
            )}
          </div>

            </div>
          </section>
        </div>
      ) : null}

      <section className="border-y border-[#e4e8e6] bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#287a63]">Hiểu rõ trước khi dùng</span>
            <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-[-.025em] sm:text-[36px]">Tiền hoàn từ đâu, có an toàn không?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">QBot chỉ xử lý link sản phẩm và theo dõi hoa hồng, không đăng nhập hoặc mua hàng thay bạn.</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#d6e4de] bg-[#fafcfb] p-4 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><CircleDollarSign className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-bold">Tiền hoàn từ hoa hồng</h3>
              <p className="mt-1.5 text-xs leading-5 text-neutral-600">Sàn trả hoa hồng tiếp thị liên kết, QBot chia lại một phần cho bạn.</p>
            </article>
            <article className="rounded-2xl border border-[#d6e4de] bg-[#fafcfb] p-4 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><ShieldCheck className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-bold">Không hỏi mật khẩu</h3>
              <p className="mt-1.5 text-xs leading-5 text-neutral-600">QBot chỉ nhận link sản phẩm, không đăng nhập tài khoản sàn của bạn.</p>
            </article>
            <article className="rounded-2xl border border-[#d6e4de] bg-[#fafcfb] p-4 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><ShoppingBag className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-bold">Không giữ tiền mua hàng</h3>
              <p className="mt-1.5 text-xs leading-5 text-neutral-600">Bạn tự đặt hàng và thanh toán trên Shopee hoặc TikTok Shop.</p>
            </article>
          </div>

          <div className="mt-5 text-center">
            <a href="/bat-dau" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#9ec9b9] bg-[#f1f7f4] px-5 text-sm font-bold text-[#287a63] hover:border-[#287a63]">
              Xem giải thích chi tiết <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8a6c35]">Tiền hoàn được chia thế nào?</span>
            <h2 className="mx-auto mt-2 whitespace-nowrap text-[clamp(17px,5vw,34px)] font-bold leading-tight tracking-[-.03em] sm:mt-3">Hoa hồng 25.000đ → Bạn nhận 17.500đ</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-[15px] sm:leading-7">Nói đơn giản: sau khi sàn duyệt đơn và trừ thuế, QBot gửi lại bạn 70% phần hoa hồng còn lại.</p>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-[#d6e4de] bg-white shadow-[0_18px_50px_rgba(48,52,59,.08)] sm:mt-8">
            <div className="grid gap-0 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <div className="p-4 text-center sm:p-6">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><ShoppingBag className="h-5 w-5" /></span>
                <p className="mt-2 text-xs text-neutral-500">Hoa hồng còn lại</p>
                <strong className="mt-1 block text-xl">25.000đ</strong>
              </div>
              <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-neutral-300 sm:rotate-0" />
              <div className="p-4 text-center sm:p-6">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f7f2e7] text-[#8a6c35]"><CircleDollarSign className="h-5 w-5" /></span>
                <p className="mt-2 text-xs text-neutral-500">Phần của bạn</p>
                <strong className="mt-1 block text-xl text-[#8a6c35]">70%</strong>
              </div>
              <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-neutral-300 sm:rotate-0" />
              <div className="bg-[#f1f7f4] p-5 text-center sm:p-6">
                <span className="text-xs font-semibold text-[#287a63]">Tiền bạn nhận</span>
                <strong className="mt-1 block text-3xl font-black text-[#287a63]">17.500đ</strong>
              </div>
            </div>
            <p className="border-t border-[#e7e9ed] px-4 py-3 text-center text-[11px] leading-5 text-neutral-500">Đây là ví dụ cho dễ hình dung. Tiền thực tế tùy sản phẩm và kết quả đối soát của sàn.</p>
          </div>
        </div>
      </section>

      <section id="luu-y" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading eyebrow="Đừng bỏ qua" title="Làm đúng để đơn hàng được ghi nhận" description="Bốn lưu ý nhỏ dưới đây giúp bạn tránh mất quyền nhận tiền hoàn." />
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {notices.map((notice, index) => (
              <div key={notice} className="flex gap-3 rounded-2xl border border-[#ddd5c5] bg-white p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f7f4ed] text-sm font-bold text-[#8a6c35]">{index + 1}</span>
                <p className="pt-1 text-sm leading-6 text-neutral-700">{notice}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cau-hoi" className="scroll-mt-20 border-y border-[#e7e9ed] bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="Hỏi nhanh – đáp gọn" title="Câu hỏi thường gặp" description="Những điều người mới thường muốn biết trước khi bắt đầu." />
          <div className="mt-9 grid gap-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-[#dfe2e6] bg-[#fafaf8] px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center gap-3 font-semibold">
                  <HelpCircle className="h-5 w-5 shrink-0 text-[#287a63]" />
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                </summary>
                <p className="ml-8 mt-3 text-sm leading-6 text-neutral-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#30343b] px-5 py-10 text-center text-white sm:px-12 sm:py-12">
          <CircleDollarSign className="mx-auto h-9 w-9 text-[#c6a76a]" />
          <h2 className="mt-4 text-[27px] font-bold leading-tight sm:text-[36px]">Bạn chỉ cần một link sản phẩm để bắt đầu</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">Tạo tài khoản miễn phí và để Ry hướng dẫn từng bước.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={onRegister} className="min-h-14 rounded-2xl bg-[#287a63] px-6 text-base font-bold text-white hover:bg-[#329176]">Đăng ký và nhận hoàn tiền</button>
            <button onClick={onLogin} className="min-h-14 rounded-2xl border border-white/20 px-6 text-base font-semibold text-white hover:bg-white/10">Tôi đã có tài khoản</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e7e9ed] bg-white px-4 py-7 text-[11px] text-neutral-500 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-[#30343b]"><img src="/api/site-assets/logo" alt="" className="h-7 w-7 rounded-full" /> Hoàn Tiền Mua Hàng</div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a href="/hoan-tien-shopee" className="hover:text-[#287a63]">Hoàn tiền Shopee</a>
            <a href="/hoan-tien-tiktok-shop" className="hover:text-[#287a63]">Hoàn tiền TikTok Shop</a>
            <a href="/kien-thuc/cach-kiem-tra-tien-hoan-truoc-khi-mua" className="hover:text-[#287a63]">Cách kiểm tra tiền hoàn</a>
            <a href="/cach-hoat-dong" className="hover:text-[#287a63]">Cách hoạt động</a>
            <a href="/kien-thuc" className="hover:text-[#287a63]">Kiến thức</a>
            <a href="/thong-tin/dieu-khoan-dich-vu" className="hover:text-[#287a63]">Điều khoản dịch vụ</a>
            <a href="/thong-tin/chinh-sach-bao-mat" className="hover:text-[#287a63]">Chính sách bảo mật</a>
            <span>Hỗ trợ: 0375 823 061</span>
          </div>
        </div>
      </footer>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 px-3 py-2 shadow-[0_-10px_30px_rgba(48,52,59,.12)] backdrop-blur sm:hidden">
        <a href="#trang-chu" className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-5 text-base font-bold text-white">
          Dán link để kiểm tra <ArrowRight className="h-5 w-5" />
        </a>
      </div>
    </main>
  );
}

function CashbackOutcomePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="absolute -inset-5 rounded-full bg-[#dce9e4]/70 blur-3xl" />
      <div className="relative overflow-hidden rounded-[26px] border border-[#d4dcda] bg-white shadow-[0_24px_70px_rgba(48,52,59,.14)]">
        <div className="flex items-center gap-3 bg-[#287a63] px-4 py-3.5 text-white">
          <span className="relative shrink-0">
            <img src="/api/site-assets/avatar" alt="Em Ry" className="h-12 w-12 rounded-full border-2 border-white/90 bg-white object-cover" />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#287a63] bg-emerald-300" />
          </span>
          <div className="min-w-0">
            <strong className="block text-[17px] leading-5">Em Ry</strong>
            <span className="block truncate text-[11px] text-white/85">demo@qbot.vn</span>
          </div>
          <span className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10"><Menu className="h-5 w-5" /></span>
        </div>

        <div className="bg-[#f2f5f6] px-3 py-4">
          <div className="flex items-end justify-end gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 shadow-sm">Đã ghi nhận</span>
          </div>
          <div className="mt-2 flex items-start justify-end gap-2">
            <div className="max-w-[84%] break-all rounded-2xl rounded-br-md bg-[#dff3eb] px-4 py-3 text-sm leading-5 text-brand-ink">
              https://s.shopee.vn/20uEIxOF9A
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <img src="/api/site-assets/avatar" alt="" className="mt-2 h-8 w-8 shrink-0 rounded-full border bg-white object-cover" />
            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl rounded-bl-md border border-neutral-200 bg-white shadow-sm">
              <div className="flex gap-3 p-3">
                <img src="/images/seo/hoan-tien-shopee.webp" alt="" className="h-16 w-16 shrink-0 rounded-xl border border-neutral-200 bg-white object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" /> Link hoàn tiền đã sẵn sàng</div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600">Sản phẩm bạn vừa gửi trên Shopee</p>
                  <p className="mt-1 text-xs font-semibold text-neutral-700">Hoàn dự kiến: <strong className="text-[#287a63]">8.415 VND</strong></p>
                </div>
              </div>

              <div className="px-3">
                <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-3 text-sm font-bold text-white">
                  <ExternalLink className="h-4 w-4" /> Nhấn để quay lại Shopee mua hàng
                </span>
              </div>

              <div className="p-3 text-[11px] leading-5 text-neutral-500">
                <strong className="block text-xs text-neutral-700">Lưu ý:</strong>
                <p>• Để giỏ hàng trống trước khi mở link.</p>
                <p>• Mua bằng đúng link Ry tạo để đơn được ghi nhận.</p>
                <p>• Đơn hủy hoặc hoàn trả sẽ không có tiền hoàn.</p>
                <p>• Đơn có thể mất 1–24 giờ để hiển thị.</p>
              </div>
            </div>
          </div>
          <div className="mt-1 flex justify-end pr-1 text-slate-400">
            <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm"><ThumbsUp className="h-4 w-4" /><span className="h-4 w-px bg-slate-200" /><ThumbsDown className="h-4 w-4" /></span>
          </div>
        </div>

        <div className="border-t border-neutral-200 bg-white p-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 text-[11px] font-semibold text-neutral-600">
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-[#fafcfb] px-3 py-2"><HelpCircle className="h-4 w-4 text-[#287a63]" /> Hướng dẫn</span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-[#fafcfb] px-3 py-2"><WalletCards className="h-4 w-4 text-[#287a63]" /> Số dư</span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-[#fafcfb] px-3 py-2"><PackageCheck className="h-4 w-4 text-[#287a63]" /> Đơn hàng</span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-[#fafcfb] px-3 py-2"><WalletCards className="h-4 w-4 text-[#287a63]" /> Rút tiền</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-400">
              <span className="truncate">Hỏi Ry hoặc gửi link sản phẩm...</span>
              <ClipboardPaste className="h-5 w-5 shrink-0 text-[#287a63]" />
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#a8cbc0] text-white"><Send className="h-5 w-5" /></span>
          </div>
          <p className="mt-2 text-center text-[9px] text-neutral-400">Demo giao diện · Kết quả thực tế phụ thuộc sản phẩm và đối soát của sàn</p>
        </div>
      </div>
    </div>
  );
}

function ChatPreview() {
  const [previewStep, setPreviewStep] = useState(0);
  const labels = ["Sao chép link", "Dán vào Ry", "Mua trên Shopee", "Xem số dư", "Xem đơn hàng"];

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewStep((previewStep + 1) % labels.length), previewStep === 2 ? 6000 : 4800);
    return () => window.clearTimeout(timer);
  }, [previewStep, labels.length]);

  const inRy = previewStep !== 0;

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="absolute -inset-4 rounded-full bg-[#dce9e4]/60 blur-3xl sm:-inset-8" />
      <div className="relative overflow-hidden rounded-[24px] border border-[#d9dde3] bg-white p-2.5 shadow-[0_20px_55px_rgba(48,52,59,.13)] sm:p-3">
        <div className="mb-2 flex gap-1.5 px-1">
          {labels.map((label, index) => (
            <button key={label} type="button" onClick={() => setPreviewStep(index)} aria-label={label} className={`h-1.5 flex-1 overflow-hidden rounded-full ${index === previewStep ? "bg-[#287a63]" : index < previewStep ? "bg-[#9ec9b9]" : "bg-neutral-200"}`} />
          ))}
        </div>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition-colors ${inRy ? "bg-[#287a63]" : "bg-[#ee4d2d]"}`}>
          {inRy ? <img src="/api/site-assets/avatar" alt="Em Ry" className="h-11 w-11 rounded-full bg-white object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-lg font-black text-[#ee4d2d]">S</span>}
          <div><strong className="block text-[15px]">{inRy ? "Em Ry" : "Shopee"}</strong><span className="text-[11px] text-white/80">{labels[previewStep]} · Bước {previewStep + 1}/5</span></div>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-white/80"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Tự chạy</span>
        </div>

        <div className="min-h-[390px] bg-[#f4f6f7] p-3">
          {previewStep === 0 ? (
            <div className="overflow-hidden rounded-2xl border border-[#efd9cf] bg-white shadow-sm">
              <img src="/images/tutorials/copy-link-shopee.webp" alt="Nút Chia sẻ và Sao chép đường dẫn đúng vị trí trên Shopee" className="aspect-[3/2] h-auto w-full object-cover" />
              <div className="flex items-center gap-3 bg-[#fff8f4] p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ee4d2d] text-xs font-bold text-white">1</span>
                <p className="text-xs leading-5 text-neutral-700">Bấm đúng nút <strong>Chia sẻ</strong> ở phía trên, sau đó chọn <strong>Sao chép đường dẫn</strong>.</p>
              </div>
            </div>
          ) : null}

          {previewStep === 1 ? (
            <div className="space-y-3 pt-3">
              <div className="max-w-[84%] rounded-2xl rounded-bl-md border border-neutral-200 bg-white p-3 text-xs leading-5 text-neutral-700 shadow-sm">Dán link sản phẩm vào ô bên dưới rồi bấm Gửi nhé.</div>
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#dff3eb] p-3 text-xs leading-5 text-brand-ink">https://s.shopee.vn/vi-du-san-pham</div>
              <div className="mt-24 flex min-h-12 items-center gap-2 rounded-xl border-2 border-[#9ec9b9] bg-white px-3 text-xs text-brand-ink shadow-sm"><span className="min-w-0 flex-1 truncate">https://s.shopee.vn/vi-du...</span><Send className="h-5 w-5 animate-pulse text-[#287a63]" /></div>
            </div>
          ) : null}

          {previewStep === 2 ? (
            <div className="space-y-3 pt-2">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#dff3eb] p-3 text-xs">https://s.shopee.vn/vi-du-san-pham</div>
              <div className="overflow-hidden rounded-2xl rounded-bl-md border border-emerald-200 bg-white shadow-sm">
                <div className="flex gap-3 p-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#fff3ed] text-[#ee4d2d]"><ShoppingBag className="h-7 w-7" /></span>
                  <div><div className="flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Link hoàn tiền đã sẵn sàng</div><p className="mt-1 text-[11px] leading-4 text-neutral-600">Sản phẩm bạn muốn mua trên Shopee</p><strong className="mt-1 block text-[11px] text-[#287a63]">Hoàn dự kiến: đang cập nhật</strong></div>
                </div>
                <button type="button" className="mx-3 mb-3 flex min-h-12 w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-xl bg-[#287a63] text-xs font-bold text-white"><ExternalLink className="h-4 w-4" /> Quay lại Shopee để mua hàng</button>
                <p className="border-t border-neutral-100 px-3 py-2 text-[10px] leading-4 text-neutral-500">Mua bằng đúng link Ry tạo để đơn được ghi nhận.</p>
              </div>
            </div>
          ) : null}

          {previewStep === 3 ? (
            <div className="pt-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#287a63] to-[#216653] p-5 text-white shadow-lg">
                <span className="text-xs text-white/70">Số dư có thể rút</span>
                <strong className="mt-2 block text-3xl">125.000đ</strong>
                <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[11px]"><span className="rounded-xl bg-white/10 p-2.5">Đang chờ<br /><strong className="text-sm">42.500đ</strong></span><span className="rounded-xl bg-white/10 p-2.5">Đã nhận<br /><strong className="text-sm">125.000đ</strong></span></div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4"><WalletCards className="h-8 w-8 text-[#287a63]" /><div><strong className="text-sm">Kiểm tra số dư</strong><p className="mt-1 text-xs text-neutral-500">Chỉ cần nhắn “số dư” cho Ry.</p></div></div>
            </div>
          ) : null}

          {previewStep === 4 ? (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-sm font-bold"><PackageCheck className="h-5 w-5 text-[#287a63]" /> Đơn hàng 10 ngày gần nhất</div>
              {[
                { number: "1", title: "Hộp đựng bút chì và đồ dùng học tập", date: "Đang cập nhật", status: "Đang xét duyệt", dot: "bg-amber-400", amount: "9.583đ", imageTone: "bg-[#fff3ed] text-[#ee4d2d]" },
                { number: "2", title: "Sản phẩm mua trên Shopee", date: "26/07/2026", status: "Thành công", dot: "bg-emerald-500", amount: "17.500đ", imageTone: "bg-[#f1f7f4] text-[#287a63]" }
              ].map((order) => (
                <article key={order.number} className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_5px_16px_rgba(48,52,59,.055)]">
                  <div className="p-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0">
                        <span className={`flex h-14 w-14 items-center justify-center rounded-lg ${order.imageTone}`}><ShoppingBag className="h-6 w-6" /></span>
                        <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#30343b] px-1 text-[9px] font-semibold text-white shadow-sm">{order.number}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words text-[11px] font-normal leading-4 text-brand-ink">{order.title}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-neutral-500"><Clock3 className="h-3 w-3" /> Đối soát: {order.date}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-2 border-t border-[#e7e9ed] bg-[#fafaf8] px-2.5 py-2 text-[11px]">
                    <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-neutral-600"><span className={`h-1.5 w-1.5 rounded-full ${order.dot}`} />{order.status}</span>
                    <span className="min-w-0 text-right"><span className="text-neutral-500">Hoàn dự kiến </span><strong className="font-semibold text-brand-red">{order.amount}</strong></span>
                  </div>
                </article>
              ))}
              <div className="inline-flex h-8 w-full items-center justify-center rounded-md border border-[#cfe1da] bg-[#f1f7f4] px-2.5 text-[11px] font-semibold text-brand-red">Kiểm tra toàn bộ đơn hàng</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#287a63]">{eyebrow}</span>
      <h2 className="mt-3 text-[28px] font-bold leading-[1.2] tracking-[-.02em] sm:text-[38px]">{title}</h2>
      <p className="mt-4 text-[15px] leading-[1.65] text-neutral-500">{description}</p>
    </div>
  );
}

function StepBadge({ value, tone }: { value: string; tone: "orange" | "cyan" }) {
  const color = tone === "orange" ? "bg-[#ee4d2d]" : "bg-[#16717c]";
  return <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${color}`}>{value}</span>;
}
