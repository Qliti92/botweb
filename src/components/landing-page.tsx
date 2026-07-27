"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardPaste,
  Clock3,
  Download,
  ExternalLink,
  HelpCircle,
  Link2,
  LogIn,
  PackageCheck,
  PlusSquare,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  UserPlus,
  WalletCards
} from "lucide-react";

type LandingPageProps = {
  onLogin: () => void;
  onRegister: () => void;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const steps = [
  {
    icon: UserPlus,
    title: "Tạo tài khoản miễn phí",
    text: "Tài khoản giúp hệ thống ghi nhận đơn hàng, tiền hoàn và lịch sử rút tiền đúng cho bạn. Bạn chỉ cần tạo một lần."
  },
  {
    icon: ClipboardPaste,
    title: "Gửi link sản phẩm cho Ry",
    text: "Sao chép link sản phẩm trên Shopee hoặc TikTok Shop rồi dán vào khung chat."
  },
  {
    icon: ShoppingBag,
    title: "Mở link Ry gửi và đặt hàng",
    text: "Ry tạo link mua hàng dành riêng cho bạn. Hãy mở đúng link này để mua hàng."
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
  const [installGuideTab, setInstallGuideTab] = useState<"iphone" | "android">("iphone");
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onInstallPrompt);
  }, []);

  async function installOnAndroid() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
  }

  return (
    <main className="landing-page metal-theme min-h-dvh overflow-hidden bg-[#fafaf8] pb-20 text-[#30343b] sm:pb-0">
      <header className="safe-top sticky top-0 z-40 border-b border-[#e4e6e9] bg-[#fafaf8]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
          <a href="#trang-chu" className="flex min-w-0 flex-1 items-center gap-2.5">
            <img src="/api/site-assets/logo" alt="Hoàn Tiền Mua Hàng" className="h-10 w-10 shrink-0 rounded-full bg-white object-cover ring-1 ring-[#d9dde3]" />
            <div className="min-w-0">
              <strong className="block truncate text-[13px] sm:text-sm">Hoàn Tiền Mua Hàng</strong>
              <span className="hidden text-[10px] text-neutral-500 sm:block">Em Ry · Trợ lý hoàn tiền</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-xs font-medium text-neutral-600 md:flex">
            <a href="#cach-hoat-dong" className="transition hover:text-[#287a63]">Cách hoạt động</a>
            <a href="#sao-chep-link" className="transition hover:text-[#287a63]">Cách lấy link</a>
            <a href="#cai-ung-dung" className="transition hover:text-[#287a63]">Cài ứng dụng</a>
            <a href="#luu-y" className="transition hover:text-[#287a63]">Lưu ý</a>
            <a href="#cau-hoi" className="transition hover:text-[#287a63]">Câu hỏi thường gặp</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition hover:bg-[#f1f3f4]">
              <LogIn className="h-4 w-4" /> <span className="hidden min-[380px]:inline">Đăng nhập</span>
            </button>
            <button onClick={onRegister} className="hidden h-11 items-center gap-1.5 rounded-xl bg-[#287a63] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#216653] min-[390px]:inline-flex">
              <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Bắt đầu miễn phí</span><span className="sm:hidden">Đăng ký</span>
            </button>
          </div>
        </div>
      </header>

      <section id="trang-chu" className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(40,122,99,.10),transparent_28%),radial-gradient(circle_at_88%_75%,rgba(198,167,106,.14),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-9 px-4 pb-12 pt-8 sm:min-h-[650px] sm:px-6 sm:py-14 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e4de] bg-white/80 px-3 py-2 text-[11px] font-semibold text-[#287a63] shadow-sm">
              <Check className="h-4 w-4" /> Miễn phí · Không cần cài ứng dụng
            </span>
            <h1 className="mx-auto mt-5 max-w-2xl text-[34px] font-bold leading-[1.14] tracking-[-.025em] sm:text-[48px] lg:mx-0 lg:text-[56px]">
              Mua hàng như bình thường,
              <span className="mt-1 block text-[#287a63]">nhận lại 70% hoa hồng.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-[1.7] text-neutral-600 lg:mx-0">
              Đăng ký miễn phí, gửi link sản phẩm cho Ry và mua hàng qua link được tạo. Bạn có thể theo dõi đơn và tiền hoàn ngay trong tài khoản.
            </p>

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#d6e4de] bg-white/80 p-4 text-left lg:mx-0">
              <strong className="flex items-center gap-2 text-sm text-[#287a63]"><ShieldCheck className="h-4 w-4" /> Tại sao cần đăng ký tài khoản?</strong>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Để hệ thống biết đơn hàng và tiền hoàn thuộc về bạn, lưu lịch sử giao dịch và hỗ trợ bạn rút tiền an toàn. <strong className="text-[#30343b]">Đăng ký hoàn toàn miễn phí.</strong></p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:justify-start">
              <button onClick={onRegister} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-6 text-base font-bold text-white shadow-[0_12px_30px_rgba(40,122,99,.2)] transition hover:-translate-y-0.5 hover:bg-[#216653]">
                Bắt đầu – Đăng ký miễn phí <ArrowRight className="h-5 w-5" />
              </button>
              <a href="#cach-hoat-dong" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d9dde3] bg-white px-6 text-base font-semibold transition hover:border-[#bfc5cc] hover:bg-[#f7f8f8]">
                Xem cách hoạt động <ChevronDown className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-neutral-500 lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#287a63]" /> Chỉ mất vài phút</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#287a63]" /> Thông tin được bảo vệ</span>
            </div>
          </div>

          <ChatPreview />
        </div>
      </section>

      <section id="cach-hoat-dong" className="scroll-mt-20 border-y border-[#e7e9ed] bg-white py-10 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Rất dễ sử dụng" title="Bạn chỉ cần làm 4 bước" description="Làm lần lượt từ bước 1 đến bước 4. Ry sẽ hướng dẫn bạn trong suốt quá trình." />

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
            <button onClick={onRegister} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-semibold text-white hover:bg-[#216653] sm:w-auto">
              Thực hiện bước 1 ngay <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="sao-chep-link" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Hướng dẫn trên điện thoại"
            title="Cách sao chép đường dẫn sản phẩm"
            description="Bạn đang xem sản phẩm nào thì mở đúng sản phẩm đó, làm theo 2 thao tác dưới đây rồi quay lại dán link cho Ry."
          />

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
                      <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#d84c1f]">Trên ứng dụng Shopee</p>
                      <h3 className="mt-1 text-xl font-bold">Sao chép link trong 2 bước</h3>
                    </div>
                  </div>
                  <ol className="mt-5 grid gap-3 text-sm leading-6 text-neutral-700 sm:grid-cols-2">
                    <li className="flex gap-3"><StepBadge value="1" tone="orange" /><span>Mở trang sản phẩm muốn mua, chạm biểu tượng <strong>Chia sẻ</strong> ở góc trên bên phải.</span></li>
                    <li className="flex gap-3"><StepBadge value="2" tone="orange" /><span>Trong bảng hiện ra, chạm <strong>Sao chép đường dẫn</strong>.</span></li>
                  </ol>
                </div>
                <img src="/images/tutorials/copy-link-shopee.png" alt="Minh họa hai bước sao chép đường dẫn sản phẩm trên ứng dụng Shopee" className="aspect-[3/2] h-auto w-full object-cover" />
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
                <img src="/images/tutorials/copy-link-tiktok-shop.png" alt="Minh họa hai bước sao chép liên kết sản phẩm trên ứng dụng TikTok Shop" className="aspect-[3/2] h-auto w-full object-cover" />
              </article>
            )}
          </div>

          <PasteLinkDemo />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#8a6c35]">Ví dụ dễ hiểu</span>
            <h2 className="mt-3 text-[28px] font-bold leading-tight sm:text-[38px]">Bạn nhận 70% hoa hồng sau thuế</h2>
            <p className="mt-4 text-[15px] leading-7 text-neutral-600">Hoa hồng chỉ được tính khi đơn hàng hoàn tất và được sàn xác nhận. Thuế được trừ theo quy định trước khi chia 70% cho bạn.</p>
            <div className="mt-5 rounded-2xl bg-[#f1f7f4] p-4 text-sm leading-6 text-neutral-700">
              <strong className="block text-[#287a63]">Công thức tính</strong>
              <span className="mt-1 block">(Hoa hồng được sàn xác nhận − Thuế) × 70% = Tiền bạn nhận</span>
            </div>
          </div>
          <div className="rounded-3xl border border-[#d6e4de] bg-white p-5 shadow-[0_18px_50px_rgba(48,52,59,.08)] sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#e7e9ed] pb-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><ShoppingBag className="h-6 w-6" /></span>
              <div><p className="text-xs text-neutral-500">Hoa hồng còn lại sau thuế (ví dụ)</p><strong className="text-2xl">25.000đ</strong></div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-6 text-center">
              <div><p className="text-xs text-neutral-500">Phần của bạn</p><strong className="mt-1 block text-xl text-[#8a6c35]">70%</strong></div>
              <ArrowRight className="h-5 w-5 text-neutral-300" />
              <div><p className="text-xs text-neutral-500">Bạn nhận</p><strong className="mt-1 block text-xl text-[#287a63]">17.500đ</strong></div>
            </div>
            <p className="rounded-xl bg-[#f6f7f8] px-4 py-3 text-xs leading-5 text-neutral-500">25.000đ × 70% = 17.500đ. Đây là ví dụ minh họa; số thực tế phụ thuộc hoa hồng, thuế và đối soát của từng đơn.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7e9ed] bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Link2 className="mx-auto h-8 w-8 text-[#287a63]" />
          <h2 className="mt-3 text-[28px] font-bold">Bạn đã có link sản phẩm?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">Tạo tài khoản rồi dán link vào khung chat. Ry sẽ hướng dẫn bạn bước tiếp theo.</p>
          <button onClick={onRegister} className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-7 text-base font-bold text-white hover:bg-[#216653]">
            Gửi link cho Ry <Send className="h-5 w-5" />
          </button>
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

      <section id="cai-ung-dung" className="scroll-mt-20 border-y border-[#e7e9ed] bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading eyebrow="Mở nhanh như ứng dụng" title="Cài Em Ry trên điện thoại" description="Miễn phí, nhẹ và không cần tải từ App Store hay CH Play. Chọn loại điện thoại của bạn rồi làm theo." />

          <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 rounded-2xl bg-[#eceeed] p-1.5" role="tablist" aria-label="Chọn loại điện thoại">
            <button type="button" role="tab" aria-selected={installGuideTab === "iphone"} onClick={() => setInstallGuideTab("iphone")} className={`min-h-12 rounded-xl px-3 text-sm font-bold transition ${installGuideTab === "iphone" ? "bg-[#287a63] text-white shadow-sm" : "text-neutral-600"}`}>
              iPhone
            </button>
            <button type="button" role="tab" aria-selected={installGuideTab === "android"} onClick={() => setInstallGuideTab("android")} className={`min-h-12 rounded-xl px-3 text-sm font-bold transition ${installGuideTab === "android" ? "bg-[#287a63] text-white shadow-sm" : "text-neutral-600"}`}>
              Android
            </button>
          </div>

          <div className="mx-auto mt-6 max-w-4xl overflow-hidden rounded-3xl border border-[#d6e4de] bg-[#fafaf8] shadow-[0_14px_40px_rgba(48,52,59,.07)]">
            {installGuideTab === "iphone" ? (
              <div className="grid items-center lg:grid-cols-[1.05fr_.95fr]">
                <div className="p-5 sm:p-7">
                  <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf4f0] text-[#287a63]"><Smartphone className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-[#287a63]">Trên iPhone</p><h3 className="text-xl font-bold">Thêm vào Màn hình chính</h3></div></div>
                  <div className="mt-5 grid gap-3 text-sm leading-6 text-neutral-700">
                    <p className="flex gap-3"><Share2 className="mt-0.5 h-5 w-5 shrink-0 text-[#287a63]" /><span>Mở <strong>Safari</strong>, truy cập <strong>qbot.vn</strong> rồi chọn <strong>Chia sẻ</strong>.</span></p>
                    <p className="flex gap-3"><PlusSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#287a63]" /><span>Chọn <strong>Thêm vào Màn hình chính</strong> → <strong>Thêm</strong>.</span></p>
                  </div>
                  <p className="mt-5 rounded-xl bg-[#f1f7f4] p-3 text-sm font-semibold leading-6 text-[#216653]">Xong! Chạm biểu tượng Em Ry trên màn hình để mở như ứng dụng.</p>
                </div>
                <img src="/images/tutorials/install-iphone-pwa.png" alt="Hướng dẫn cài Em Ry vào màn hình chính iPhone" className="h-auto w-full border-t border-[#dfe8e4] object-cover lg:border-l lg:border-t-0" />
              </div>
            ) : (
              <div className="mx-auto max-w-2xl p-5 text-center sm:p-8">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf4f0] text-[#287a63]"><Download className="h-7 w-7" /></span>
                <h3 className="mt-4 text-xl font-bold">Cài Em Ry trên Android</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-600">Mở trang bằng Chrome rồi bấm nút bên dưới. Nếu chưa thấy nút cài, mở menu <strong>⋮</strong> và chọn <strong>Thêm vào Màn hình chính</strong>.</p>
                {installEvent ? (
                  <button type="button" onClick={() => void installOnAndroid()} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-6 text-base font-bold text-white sm:w-auto"><Download className="h-5 w-5" /> Cài ứng dụng ngay</button>
                ) : (
                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                    <p className="rounded-xl bg-white p-4 text-sm"><strong>1.</strong> Chạm menu <strong>⋮</strong> của Chrome.</p>
                    <p className="rounded-xl bg-white p-4 text-sm"><strong>2.</strong> Chọn <strong>Thêm vào Màn hình chính</strong>.</p>
                  </div>
                )}
              </div>
            )}
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
            <a href="/kien-thuc" className="hover:text-[#287a63]">Kiến thức</a>
            <a href="/thong-tin/dieu-khoan-dich-vu" className="hover:text-[#287a63]">Điều khoản dịch vụ</a>
            <a href="/thong-tin/chinh-sach-bao-mat" className="hover:text-[#287a63]">Chính sách bảo mật</a>
            <span>Hỗ trợ: 0375 823 061</span>
          </div>
        </div>
      </footer>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 px-3 py-2 shadow-[0_-10px_30px_rgba(48,52,59,.12)] backdrop-blur sm:hidden">
        <button onClick={onRegister} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-5 text-base font-bold text-white">
          Bắt đầu miễn phí <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </main>
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
              <img src="/images/tutorials/copy-link-shopee.png" alt="Nút Chia sẻ và Sao chép đường dẫn đúng vị trí trên Shopee" className="aspect-[3/2] h-auto w-full object-cover" />
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

function PasteLinkDemo() {
  const [demoStep, setDemoStep] = useState<0 | 1 | 2 | 3>(0);
  const demoLink = "https://s.shopee.vn/vi-du-san-pham";

  useEffect(() => {
    const delays = [1300, 1500, 1700, 4200] as const;
    const timer = window.setTimeout(() => setDemoStep((demoStep + 1) % 4 as 0 | 1 | 2 | 3), delays[demoStep]);
    return () => window.clearTimeout(timer);
  }, [demoStep]);

  return (
    <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-[#d6e4de] bg-white shadow-[0_16px_44px_rgba(48,52,59,.08)]">
      <div className="border-b border-[#dfe8e4] bg-[#f1f7f4] p-5 text-center sm:p-6">
        <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#287a63]">Bước tiếp theo</span>
        <h3 className="mt-2 text-xl font-bold sm:text-2xl">Dán link vào chat Em Ry như thế nào?</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-600">Mô phỏng sẽ tự chạy: link xuất hiện trong chat, Ry xử lý và gửi lại link mua hàng.</p>
      </div>

      <div className="bg-[#eef2f3] p-3 sm:p-6">
          <div className="mx-auto max-w-lg overflow-hidden rounded-[24px] border border-[#d9dde3] bg-white shadow-[0_14px_35px_rgba(48,52,59,.12)]">
            <div className="flex items-center gap-3 bg-[#287a63] px-4 py-3 text-white">
              <img src="/api/site-assets/avatar" alt="Em Ry" className="h-10 w-10 rounded-full bg-white object-cover" />
              <div><strong className="block text-sm">Em Ry</strong><span className="text-[10px] text-white/75">Trực tuyến · Sẵn sàng nhận link</span></div>
            </div>

            <div className="min-h-[310px] space-y-3 bg-[#f4f6f7] p-3">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#e4e6e9] bg-white px-3.5 py-2.5 text-xs leading-5 text-neutral-700 shadow-sm">
                Bạn dán link sản phẩm vào ô bên dưới rồi nhấn Gửi nhé.
              </div>

              {demoStep >= 2 ? <div className="ml-auto max-w-[88%] animate-[fadeIn_.35s_ease-out] break-all rounded-2xl rounded-br-md bg-[#dff3eb] px-3.5 py-2.5 text-xs leading-5 text-brand-ink">{demoLink}</div> : null}

              {demoStep === 2 ? (
                <div className="flex max-w-[72%] items-center gap-2 rounded-2xl rounded-bl-md border border-[#e4e6e9] bg-white px-3 py-2.5 text-xs text-neutral-500 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#287a63]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#287a63] [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#287a63] [animation-delay:300ms]" />
                  <span>Ry đang tạo link...</span>
                </div>
              ) : null}

              {demoStep === 3 ? (
                <div className="max-w-[96%] animate-[fadeIn_.4s_ease-out] overflow-hidden rounded-2xl rounded-bl-md border border-emerald-200 bg-white shadow-sm">
                  <div className="flex gap-3 p-3">
                    <img src="/images/tutorials/copy-link-shopee.png" alt="" className="h-14 w-14 shrink-0 rounded-xl border border-neutral-100 object-cover" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#287a63]"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Link hoàn tiền đã sẵn sàng</div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-neutral-600">Sản phẩm bạn vừa gửi cho Ry</p>
                      <strong className="mt-1 block text-[11px] text-[#287a63]">Hoàn dự kiến: đang cập nhật</strong>
                    </div>
                  </div>
                  <div className="mx-3 mb-3 grid min-h-11 w-[calc(100%-1.5rem)] place-items-center rounded-xl bg-[#287a63] px-3 text-xs font-bold text-white">Nhấn quay lại Shopee để mua hàng</div>
                  <div className="border-t border-neutral-100 px-3 py-2 text-[10px] leading-4 text-neutral-500">Để giỏ hàng trống trước khi mở link và mua bằng đúng link Ry tạo.</div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-[#e4e6e9] bg-white p-3">
              <div className="flex items-center gap-2">
                <div className={`flex min-h-12 min-w-0 flex-1 items-center rounded-xl border px-3 text-xs transition ${demoStep === 1 ? "border-[#9ec9b9] bg-[#f1f7f4] text-brand-ink" : "border-[#d9dde3] text-neutral-400"}`}>
                  <span className="min-w-0 truncate">{demoStep === 1 ? demoLink : "Hỏi Ry hoặc gửi link sản phẩm..."}</span>
                </div>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition ${demoStep === 1 ? "scale-105 bg-[#287a63] text-white shadow-lg" : "bg-[#b9d6cc] text-white"}`}>
                  {demoStep === 0 ? <ClipboardPaste className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-medium text-[#287a63]">{demoStep === 0 ? "Đang sao chép link..." : demoStep === 1 ? "Đã dán link — chuẩn bị gửi" : demoStep === 2 ? "Đã gửi cho Ry" : "Ry đã tạo link xong"}</p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
