"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardPaste,
  ExternalLink,
  HelpCircle,
  Link2,
  LogIn,
  PackageCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  WalletCards
} from "lucide-react";

type LandingPageProps = {
  onLogin: () => void;
  onRegister: () => void;
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

      <section id="cach-hoat-dong" className="scroll-mt-20 border-y border-[#e7e9ed] bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Rất dễ sử dụng" title="Bạn chỉ cần làm 4 bước" description="Làm lần lượt từ bước 1 đến bước 4. Ry sẽ hướng dẫn bạn trong suốt quá trình." />
          <div className="relative mt-10 grid gap-4 md:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="relative rounded-2xl border border-[#dfe2e6] bg-[#fafaf8] p-5 shadow-sm">
                <span className="absolute right-4 top-4 text-4xl font-black text-[#e1e9e6]">{index + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#eaf4f0] text-[#287a63]"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 pr-6 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
                {index < steps.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 rounded-full bg-white p-1 text-[#287a63] shadow md:block" /> : null}
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={onRegister} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-semibold text-white hover:bg-[#216653]">
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

          <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-[#d6e4de] bg-[#f1f7f4] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#287a63]"><ClipboardPaste className="h-5 w-5" /></span>
              <div>
                <strong className="text-sm">Đã sao chép xong?</strong>
                <p className="mt-1 text-xs leading-5 text-neutral-600">Quay lại trang này, mở Ry, nhấn giữ trong ô nhập tin nhắn và chọn <strong>Dán</strong>.</p>
              </div>
            </div>
            <button onClick={onRegister} className="mt-4 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-bold text-white sm:mt-0 sm:w-auto">
              Mở Ry để dán link <ArrowRight className="h-4 w-4" />
            </button>
          </div>
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
  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="absolute -inset-4 rounded-full bg-[#dce9e4]/60 blur-3xl sm:-inset-8" />
      <div className="relative overflow-hidden rounded-[24px] border border-[#d9dde3] bg-white p-2.5 shadow-[0_20px_55px_rgba(48,52,59,.13)] sm:p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-[#287a63] px-4 py-3 text-white">
          <img src="/api/site-assets/avatar" alt="Em Ry" className="h-11 w-11 rounded-full bg-white object-cover" />
          <div><strong className="block text-[15px]">Em Ry</strong><span className="text-[11px] text-white/75">Trợ lý hoàn tiền</span></div>
          <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-white/80 min-[370px]:flex"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Trực tuyến</span>
        </div>
        <div className="grid gap-3 bg-[#f4f6f7] px-3 py-5">
          <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-[#30343b] px-3.5 py-3 text-[13px] leading-5 text-white">Mình muốn mua sản phẩm này:<br />shopee.vn/san-pham...</div>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-[#e4e6e9] bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold"><PackageCheck className="h-4 w-4 text-[#287a63]" /> Link mua hàng đã sẵn sàng</div>
            <p className="mt-2 text-xs leading-5 text-neutral-600">Bạn mở link dưới đây và đặt hàng để hệ thống có thể ghi nhận tiền hoàn nhé.</p>
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#287a63] px-3 py-3 text-[13px] font-semibold text-white">Mở link và mua hàng <ExternalLink className="h-4 w-4" /></div>
          </div>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#e4e6e9] bg-white px-3 text-[12px] text-neutral-400"><span className="flex-1">Dán link sản phẩm vào đây...</span><Send className="h-5 w-5 text-[#287a63]" /></div>
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
