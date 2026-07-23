"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  CircleDollarSign,
  Gift,
  Link2,
  LogIn,
  MessageCircle,
  PackageCheck,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";

type LandingPageProps = {
  onLogin: () => void;
  onRegister: () => void;
};

const botFeatures = [
  { icon: Link2, title: "Tạo link hoàn tiền", text: "Gửi link Shopee hoặc TikTok Shop, Em Ry tạo link mua hàng giúp bạn." },
  { icon: PackageCheck, title: "Theo dõi đơn hàng", text: "Kiểm tra đơn 10 ngày gần nhất, trạng thái đối soát và tiền hoàn dự kiến." },
  { icon: WalletCards, title: "Quản lý tiền hoàn", text: "Xem số dư, lịch sử rút tiền, nhiệm vụ và thông báo ngay trong chat." },
  { icon: MessageCircle, title: "Tra soát nhanh", text: "Mô tả vấn đề bằng câu tự nhiên, Ry sẽ mở đúng biểu mẫu hỗ trợ." }
];

const affiliateSteps = [
  { number: "01", title: "Đăng ký miễn phí", text: "Tạo tài khoản để nhận mã và link giới thiệu riêng." },
  { number: "02", title: "Chia sẻ cho bạn bè", text: "Gửi link qua Zalo, Messenger hoặc cho người thân." },
  { number: "03", title: "Nhận hoa hồng", text: "Theo dõi F1, F2 và hoa hồng đủ điều kiện ngay trong Em Ry." }
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <main className="metal-theme min-h-dvh overflow-hidden bg-[#fafaf8] pb-20 text-[#30343b] sm:pb-0">
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
            <a href="#em-ry" className="transition hover:text-[#287a63]">Em Ry</a>
            <a href="#tiep-thi-lien-ket" className="transition hover:text-[#287a63]">Tiếp thị liên kết</a>
            <a href="#cach-bat-dau" className="transition hover:text-[#287a63]">Cách bắt đầu</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-[#30343b] transition hover:bg-[#f1f3f4]">
              <LogIn className="h-4 w-4" /> <span className="hidden min-[380px]:inline">Đăng nhập</span>
            </button>
            <button onClick={onRegister} className="hidden h-11 items-center gap-1.5 rounded-xl bg-[#287a63] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#216653] min-[390px]:inline-flex">
              <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Đăng ký miễn phí</span><span className="sm:hidden">Đăng ký</span>
            </button>
          </div>
        </div>
      </header>

      <section id="trang-chu" className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(40,122,99,.10),transparent_28%),radial-gradient(circle_at_88%_75%,rgba(198,167,106,.14),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-9 px-4 pb-12 pt-8 sm:min-h-[650px] sm:px-6 sm:py-14 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e4de] bg-white/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.1em] text-[#287a63] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Hoàn tiền đơn giản cùng Em Ry
            </span>
            <h1 className="mx-auto mt-5 max-w-2xl text-[34px] font-bold leading-[1.12] tracking-[-.04em] min-[390px]:text-[38px] sm:text-[48px] lg:mx-0 lg:text-[56px]">
              Mua hàng có hoàn tiền
              <span className="mt-1 block text-[#287a63]">chỉ bằng một tin nhắn.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-7 text-neutral-600 lg:mx-0">
              Gửi link Shopee hoặc TikTok Shop cho Em Ry. Trợ lý sẽ tạo link hoàn tiền, theo dõi đơn và quản lý ví ngay trong chat.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:justify-start">
              <button onClick={onRegister} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#287a63] px-6 text-base font-bold text-white shadow-[0_12px_30px_rgba(40,122,99,.2)] transition hover:-translate-y-0.5 hover:bg-[#216653]">
                Bắt đầu với Em Ry <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={onLogin} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d9dde3] bg-white px-6 text-base font-semibold text-[#30343b] transition hover:border-[#bfc5cc] hover:bg-[#f7f8f8]">
                Tôi đã có tài khoản
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2 text-[13px] text-neutral-500 sm:flex-row sm:flex-wrap sm:gap-x-5 lg:items-start">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#287a63]" /> Không mất phí đăng ký</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#287a63]" /> Không cần cài ứng dụng</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#287a63]" /> Thông tin được bảo vệ</span>
            </div>
          </div>

          <ChatPreview />
        </div>
      </section>

      <section id="em-ry" className="border-y border-[#e7e9ed] bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Trợ lý chat" title="Một cuộc trò chuyện, mọi việc rõ ràng" description="Bạn không cần nhớ nhiều lệnh. Hãy nói điều mình cần, Em Ry sẽ nhận diện và đưa bạn đến đúng chức năng." />
          <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {botFeatures.map(({ icon: Icon, title, text }) => (
              <article key={title} className="flex gap-4 rounded-2xl border border-[#dfe2e6] bg-[#fafaf8] p-4 transition hover:-translate-y-0.5 hover:border-[#cbd8d3] hover:shadow-[0_12px_32px_rgba(48,52,59,.07)] sm:block sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><Icon className="h-5 w-5" /></span>
                <div><h3 className="text-[15px] font-semibold sm:mt-4">{title}</h3><p className="mt-1.5 text-[13px] leading-5 text-neutral-500 sm:mt-2">{text}</p></div>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={onRegister} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-semibold text-white hover:bg-[#216653]">
              Dùng thử Em Ry miễn phí <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section id="tiep-thi-lien-ket" className="py-12 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#8a6c35]"><Gift className="h-4 w-4" /> Chương trình tiếp thị liên kết</span>
            <h2 className="mt-3 max-w-xl text-[30px] font-bold leading-tight tracking-[-.03em] sm:text-[38px]">Giới thiệu cho bạn bè, nhận thêm hoa hồng</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-neutral-600">
              Mỗi thành viên có một link giới thiệu riêng. Khi người được giới thiệu mua sắm và đơn đủ điều kiện, bạn có cơ hội nhận hoa hồng từ F1 và F2.
            </p>
            <div className="mt-6 grid max-w-lg gap-3 min-[380px]:grid-cols-2">
              <CommissionBox level="F1" rate="20%" description="Thành viên bạn giới thiệu trực tiếp" />
              <CommissionBox level="F2" rate="10%" description="Thành viên do F1 giới thiệu tiếp" />
            </div>
            <button onClick={onRegister} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#287a63] px-5 text-sm font-semibold text-white hover:bg-[#216653] sm:w-auto">
              Tạo link giới thiệu miễn phí <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div id="cach-bat-dau" className="rounded-3xl border border-[#ddd5c5] bg-white p-5 shadow-[0_18px_50px_rgba(48,52,59,.07)] sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#e7e9ed] pb-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7f4ed] text-[#8a6c35]"><Users className="h-5 w-5" /></span>
              <div><span className="text-[10px] uppercase tracking-[.12em] text-neutral-400">Bắt đầu trong vài phút</span><h3 className="text-base font-semibold">Cách tham gia chương trình</h3></div>
            </div>
            <div className="mt-5 grid gap-5">
              {affiliateSteps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <span className="text-xl font-semibold text-[#c6a76a]">{step.number}</span>
                  <div><h4 className="text-sm font-semibold">{step.title}</h4><p className="mt-1 text-xs leading-5 text-neutral-500">{step.text}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-[#f6f7f8] px-4 py-3 text-[11px] leading-5 text-neutral-500">
              Hoa hồng chỉ phát sinh khi đơn được hệ thống ghi nhận, đủ điều kiện và được sàn đối soát thành công.
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7e9ed] bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8a6c35]">Minh bạch & an toàn</span>
              <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-[-.025em]">Thông tin bạn nên biết trước khi sử dụng</h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-neutral-500">Đọc quyền, trách nhiệm và cách chúng tôi bảo vệ thông tin của bạn.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href="/thong-tin/dieu-khoan-dich-vu" className="group flex items-center gap-3 rounded-2xl border border-[#d9dde3] bg-[#fafaf8] p-4 transition hover:border-[#cbd8d3] hover:shadow-[0_8px_24px_rgba(48,52,59,.06)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7f4ed] text-[#8a6c35]"><BookOpen className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">Điều khoản dịch vụ</h3><p className="mt-1 text-[11px] text-neutral-500">Quy định và điều kiện khi sử dụng hệ thống.</p></div>
              <ArrowRight className="h-4 w-4 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-[#287a63]" />
            </a>
            <a href="/thong-tin/chinh-sach-bao-mat" className="group flex items-center gap-3 rounded-2xl border border-[#d9dde3] bg-[#fafaf8] p-4 transition hover:border-[#cbd8d3] hover:shadow-[0_8px_24px_rgba(48,52,59,.06)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1f7f4] text-[#287a63]"><ShieldCheck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">Chính sách bảo mật</h3><p className="mt-1 text-[11px] text-neutral-500">Cách dữ liệu cá nhân và tài khoản được bảo vệ.</p></div>
              <ArrowRight className="h-4 w-4 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-[#287a63]" />
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-10 sm:px-6 sm:pb-20 sm:pt-0">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#30343b] px-5 py-10 text-center text-white sm:px-12 sm:py-11">
          <CircleDollarSign className="mx-auto h-8 w-8 text-[#c6a76a]" />
          <h2 className="mt-4 text-[26px] font-bold tracking-[-.025em] sm:text-[34px]">Bắt đầu với Em Ry hôm nay</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">Đăng ký miễn phí để tạo link hoàn tiền và nhận link giới thiệu riêng của bạn.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={onRegister} className="min-h-14 rounded-2xl bg-[#287a63] px-6 text-base font-bold text-white hover:bg-[#329176]">Đăng ký miễn phí</button>
            <button onClick={onLogin} className="min-h-14 rounded-2xl border border-white/20 px-6 text-base font-semibold text-white hover:bg-white/10">Đăng nhập</button>
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
          Bắt đầu với Em Ry <ArrowRight className="h-5 w-5" />
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
        <div className="flex items-center gap-3 rounded-2xl bg-[#287a63] px-3.5 py-3 text-white sm:px-4">
          <img src="/api/site-assets/avatar" alt="Em Ry" className="h-11 w-11 rounded-full bg-white object-cover" />
          <div><strong className="block text-[15px]">Em Ry</strong><span className="text-[11px] text-white/75">Trợ lý hoàn tiền thông minh</span></div>
          <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-white/80 min-[370px]:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Trực tuyến</span>
        </div>
        <div className="grid gap-3 bg-[#f4f6f7] px-3 py-5">
          <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-[#30343b] px-3.5 py-3 text-[13px] leading-5 text-white">Ry ơi, tạo link hoàn tiền giúp mình</div>
          <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[#e4e6e9] bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold"><span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" /> Link hoàn tiền đã sẵn sàng</div>
            <div className="mt-2 flex gap-2.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f1f7f4] text-[#287a63]"><Gift className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="text-[10px] leading-4 text-neutral-600">Sản phẩm bạn đang quan tâm</p><strong className="mt-1 block text-[10px] text-[#287a63]">Hoàn dự kiến: đang cập nhật</strong></div>
            </div>
            <div className="mt-3 rounded-xl bg-[#287a63] px-3 py-3 text-center text-[13px] font-semibold text-white">Mua ngay và nhận hoàn tiền</div>
          </div>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#e4e6e9] bg-white px-3 text-[12px] text-neutral-400"><span className="flex-1">Hỏi Ry hoặc gửi link sản phẩm...</span><Send className="h-5 w-5 text-[#287a63]" /></div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#287a63]">{eyebrow}</span>
      <h2 className="mt-3 text-[30px] font-bold leading-tight tracking-[-.03em] sm:text-[38px]">{title}</h2>
      <p className="mt-4 text-[15px] leading-6 text-neutral-500">{description}</p>
    </div>
  );
}

function CommissionBox({ level, rate, description }: { level: string; rate: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[#ddd5c5] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#8a6c35]">{level}</span><strong className="text-xl text-[#287a63]">{rate}</strong></div>
      <p className="mt-2 text-[12px] leading-5 text-neutral-500">{description}</p>
    </div>
  );
}
