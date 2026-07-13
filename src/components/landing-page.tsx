"use client";

import {
  ArrowRight,
  BadgePercent,
  Check,
  CircleDollarSign,
  ClipboardCopy,
  ExternalLink,
  Gift,
  Link2,
  MousePointerClick,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users
} from "lucide-react";

type LandingPageProps = {
  onLogin: () => void;
  onRegister: () => void;
};

const benefits = [
  { icon: Link2, title: "Tạo link nhanh", text: "Dán link sản phẩm Shopee hoặc TikTok Shop, bot sẽ xử lý giúp bạn." },
  { icon: CircleDollarSign, title: "Theo dõi tiền hoàn", text: "Xem đơn hàng, số dư, lịch sử rút tiền và biến động ví ngay trong chat." },
  { icon: ShieldCheck, title: "An toàn, minh bạch", text: "Đăng nhập bảo mật, hỗ trợ 2FA và theo dõi trạng thái đơn rõ ràng." }
];

const steps = [
  { icon: ClipboardCopy, title: "Dán link sản phẩm", text: "Sao chép link từ Shopee hoặc TikTok Shop và gửi cho bot." },
  { icon: MousePointerClick, title: "Nhận link hoàn tiền", text: "Bot tạo đường dẫn mua hàng có ghi nhận hoàn tiền cho bạn." },
  { icon: ShoppingBag, title: "Mua hàng như bình thường", text: "Mở link, đặt hàng và chờ sàn đối soát đơn đủ điều kiện." }
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#fffaf8] text-[#201a18]">
      <header className="sticky top-0 z-40 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Hoàn Tiền Mua Hàng">
            <img src="/logo.png" alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-orange-100" />
            <span className="hidden text-[15px] font-bold tracking-[-0.01em] sm:block">Hoàn Tiền Mua Hàng</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-neutral-600 md:flex">
            <a href="#cach-hoat-dong" className="hover:text-[#ee4d2d]">Cách hoạt động</a>
            <a href="#gioi-thieu" className="hover:text-[#ee4d2d]">Hoa hồng giới thiệu</a>
            <a href="#quyen-loi" className="hover:text-[#ee4d2d]">Quyền lợi</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="rounded-full px-3 py-2 text-[13px] font-semibold text-[#b9361e] transition hover:bg-orange-50 sm:px-4 sm:text-sm">Đăng nhập</button>
            <button onClick={onRegister} className="rounded-full bg-[#e94b2c] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(238,77,45,.2)] transition hover:-translate-y-0.5 hover:bg-[#d83b1d] sm:px-5 sm:text-sm">Đăng ký</button>
          </div>
        </div>
      </header>

      <section id="top" className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(238,77,45,.13),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(255,181,72,.16),transparent_30%)]" />
        <div className="relative mx-auto grid min-h-[620px] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#c13b21] shadow-sm">
              <Sparkles className="h-4 w-4" /> Mua sắm thông minh hơn
            </div>
            <h1 className="max-w-2xl text-[36px] font-extrabold leading-[1.14] tracking-[-.035em] sm:text-[46px] lg:text-[52px]">
              Mua món bạn thích,
              <span className="block bg-gradient-to-r from-[#ee4d2d] to-[#ff8a43] bg-clip-text text-transparent">nhận lại một phần tiền.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-neutral-600 sm:text-base sm:leading-8">
              Tạo link hoàn tiền cho sản phẩm Shopee và TikTok Shop chỉ trong vài giây. Theo dõi đơn, quản lý ví và nhận hỗ trợ ngay trong một cuộc trò chuyện.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button onClick={onRegister} className="inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-[#e94b2c] px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(238,77,45,.22)] transition hover:-translate-y-0.5 hover:bg-[#d83b1d]">
                Bắt đầu hoàn tiền <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={onLogin} className="inline-flex h-[50px] items-center justify-center rounded-full border border-orange-200 bg-white px-6 text-sm font-bold text-[#b9361e] transition hover:bg-orange-50">
                Tôi đã có tài khoản
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-neutral-600">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Miễn phí đăng ký</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Không cần cài ứng dụng</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Hỗ trợ mỗi ngày</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-orange-200/70 to-yellow-100/40 blur-3xl" />
            <div aria-hidden="true" className="absolute -left-8 top-16 z-10 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 text-xs font-semibold text-neutral-700 shadow-[0_14px_35px_rgba(95,55,35,.14)] backdrop-blur sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CircleDollarSign className="h-4 w-4" /></span>
              <span><strong className="block text-sm text-emerald-700">+25.000đ</strong>Hoàn tiền dự kiến</span>
            </div>
            <div aria-hidden="true" className="absolute -right-7 bottom-20 z-10 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 text-xs font-semibold text-neutral-700 shadow-[0_14px_35px_rgba(95,55,35,.14)] backdrop-blur sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-50 text-[#e94b2c]"><ShieldCheck className="h-4 w-4" /></span>
              Đơn hàng đã ghi nhận
            </div>
            <div className="relative rounded-[28px] border border-orange-100/90 bg-white p-3.5 shadow-[0_26px_70px_rgba(123,60,35,.14)] lg:rotate-1">
              <div className="flex items-center gap-3 rounded-2xl bg-[#ee4d2d] p-4 text-white">
                <img src="/logo.png" alt="" className="h-11 w-11 rounded-full bg-white object-cover" />
                <div><strong className="block">Bot Hoàn Tiền</strong><span className="text-xs text-white/80">Đang hoạt động</span></div>
                <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="space-y-4 bg-[#f5f6fa] px-3 py-6">
                <div aria-hidden="true" className="grid grid-cols-[64px_1fr] gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 via-rose-50 to-amber-100">
                    <ShoppingBag className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-[#e94b2c]" />
                    <span className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white/60" />
                  </div>
                  <div className="min-w-0 py-0.5"><span className="block text-xs font-semibold text-neutral-400">Sản phẩm mẫu</span><strong className="mt-1 block truncate text-sm text-neutral-800">Món đồ bạn đang quan tâm</strong><div className="mt-2 flex gap-1.5"><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-[#d84628]">Shopee</span><span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600">TikTok Shop</span></div></div>
                </div>
                <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-[#ee4d2d] px-4 py-3 text-sm leading-6 text-white">https://shopee.vn/san-pham-yeu-thich</div>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white p-4 text-sm shadow-sm">
                  <div className="mb-2 flex items-center gap-2 font-bold"><Gift className="h-5 w-5 text-[#ee4d2d]" /> Link hoàn tiền đã sẵn sàng!</div>
                  <p className="leading-6 text-neutral-600">Mở link bên dưới để mua hàng và nhận hoàn tiền khi đơn đủ điều kiện.</p>
                  <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 font-bold text-[#d83b1d]">Hoàn tiền dự kiến: Đang cập nhật</div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-neutral-100 p-3 text-sm text-neutral-400"><span className="flex-1 rounded-full bg-neutral-100 px-4 py-3">Dán link sản phẩm...</span><span className="grid h-11 w-11 place-items-center rounded-full bg-[#ee4d2d] text-white"><Send className="h-5 w-5" /></span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="quyen-loi" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center"><span className="text-xs font-bold uppercase tracking-[.14em] text-[#d84628]">Quyền lợi thành viên</span><h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-[38px]">Mọi thứ bạn cần trong một nơi</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[22px] border border-orange-100/80 bg-[#fffaf8] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(125,67,40,.09)]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e94b2c] p-3 text-white"><Icon /></span><h3 className="mt-5 text-lg font-bold tracking-[-.01em]">{title}</h3><p className="mt-2 text-[15px] leading-7 text-neutral-600">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="cach-hoat-dong" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center"><span className="text-xs font-bold uppercase tracking-[.14em] text-[#d84628]">Chỉ 3 bước</span><h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-[38px]">Hoàn tiền thật đơn giản</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="relative rounded-[22px] border border-white bg-white p-6 shadow-[0_14px_40px_rgba(125,67,40,.07)]"><span className="absolute right-6 top-5 text-[36px] font-extrabold text-orange-100">0{index + 1}</span><Icon className="h-8 w-8 text-[#e94b2c]" /><h3 className="mt-6 text-lg font-bold tracking-[-.01em]">{title}</h3><p className="mt-2 text-[15px] leading-7 text-neutral-600">{text}</p></article>)}
          </div>
        </div>
      </section>

      <ReferralSection onRegister={onRegister} />

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[#201a18] px-6 py-12 text-center text-white sm:px-12">
          <BadgePercent className="mx-auto h-10 w-10 text-[#ff8a43]" />
          <h2 className="mx-auto mt-5 max-w-3xl text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-[38px]">Đừng bỏ lỡ tiền hoàn từ đơn hàng tiếp theo</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/70">Tạo tài khoản miễn phí và bắt đầu lấy link hoàn tiền ngay hôm nay.</p>
          <button onClick={onRegister} className="mt-7 inline-flex h-[50px] items-center gap-2 rounded-full bg-[#e94b2c] px-6 text-sm font-bold shadow-xl shadow-black/20 transition hover:bg-[#ff6545]">Đăng ký miễn phí <ArrowRight className="h-5 w-5" /></button>
        </div>
      </section>

      <footer className="border-t border-orange-100 bg-white px-4 py-8 text-[13px] text-neutral-500 sm:px-6"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row"><div className="flex items-center gap-2 font-bold text-neutral-800"><img src="/logo.png" alt="" className="h-8 w-8 rounded-full" /> Hoàn Tiền Mua Hàng</div><p>© 2026 hoantienmuahang.vn · Hỗ trợ: 0375 823 061</p></div></footer>
    </main>
  );
}

function ReferralSection({ onRegister }: { onRegister: () => void }) {
  return (
    <section id="gioi-thieu" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-[#c13b21]"><Gift className="h-4 w-4" /> Chương trình giới thiệu</span><h2 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-.025em] sm:text-[38px]">Giới thiệu một lần <span className="block text-[#e94b2c]">nhận hoa hồng lâu dài</span></h2><p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">Gửi link cho bạn bè, hướng dẫn họ sử dụng lần đầu và nhận hoa hồng khi các đơn đủ điều kiện được ghi nhận.</p></div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[24px] border border-orange-100 bg-gradient-to-br from-[#fff5f1] to-white p-6 sm:p-7">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e94b2c] text-white"><CircleDollarSign className="h-5 w-5" /></span><div><span className="text-[11px] font-bold uppercase tracking-wider text-[#d84628]">Chính sách quyền lợi</span><h3 className="text-xl font-bold tracking-[-.01em]">Hoa hồng giới thiệu</h3></div></div>
            <div className="mt-7 space-y-4">
              <CommissionCard level="F1" rate="20%" text="Người bạn trực tiếp giới thiệu" example="Hoa hồng được tính 100.000đ, bạn nhận 20.000đ." />
              <CommissionCard level="F2" rate="10%" text="Người do F1 giới thiệu tiếp" example="Hoa hồng được tính 100.000đ, bạn nhận 10.000đ." green />
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-orange-100"><Users className="h-6 w-6 shrink-0 text-[#ee4d2d]" /><div><strong>Giới thiệu càng nhiều, cơ hội càng lớn</strong><p className="mt-1 text-sm leading-6 text-neutral-600">Thu nhập phụ thuộc số người dùng, số đơn hợp lệ và hoa hồng thực tế từ sàn.</p></div></div>
          </article>
          <article className="rounded-[24px] border border-neutral-100 bg-white p-6 shadow-[0_18px_50px_rgba(125,67,40,.08)] sm:p-7">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white"><Link2 className="h-5 w-5" /></span><div><span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Hướng dẫn cơ bản</span><h3 className="text-xl font-bold tracking-[-.01em]">Cách lấy và gửi link</h3></div></div>
            <div className="mt-7 space-y-5">
              {["Mở khu vực quản lý giới thiệu", "Sao chép link có mã riêng của bạn", "Gửi link qua Zalo, Messenger hoặc cho người thân", "Hướng dẫn đăng ký và tạo link hoàn tiền lần đầu"].map((item, index) => <div key={item} className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 font-black text-[#ee4d2d]">{index + 1}</span><p className="pt-1.5 font-semibold">{item}</p></div>)}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href="https://hoantienmuahang.vn/dashboard/referrals" target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-orange-200 px-5 py-3 font-bold text-[#d83b1d]">Mở trang giới thiệu <ExternalLink className="h-4 w-4" /></a><button onClick={onRegister} className="flex-1 rounded-full bg-[#ee4d2d] px-5 py-3 font-bold text-white">Tạo tài khoản</button></div>
          </article>
        </div>
        <p className="mx-auto mt-6 max-w-5xl rounded-2xl bg-neutral-50 px-5 py-4 text-center text-sm leading-6 text-neutral-600">Hoa hồng chỉ được tính khi đơn đủ điều kiện, được hệ thống ghi nhận và sàn đối soát thành công. Đơn hủy, hoàn trả, gian lận hoặc không được ghi nhận sẽ không phát sinh hoa hồng.</p>
      </div>
    </section>
  );
}

function CommissionCard({ level, rate, text, example, green = false }: { level: string; rate: string; text: string; example: string; green?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${green ? "border-emerald-100 bg-emerald-50/70" : "border-orange-100 bg-white"}`}><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl font-black text-white ${green ? "bg-emerald-600" : "bg-[#ee4d2d]"}`}>{level}</span><strong className="min-w-0 flex-1">{text}</strong><div className="text-right"><strong className={`block text-2xl ${green ? "text-emerald-700" : "text-[#ee4d2d]"}`}>{rate}</strong><span className="text-xs text-neutral-500">hoa hồng</span></div></div><p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-sm leading-6 text-neutral-600">💡 {example}</p></div>;
}
