"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart3, Bell, BookOpen, Bot, Check, ClipboardCopy, Clock3, ExternalLink, History, Image as ImageIcon, Link2, LoaderCircle, LogOut, Menu, MousePointerClick, Plus, RefreshCw, Save, Search, Send, Server, Settings, ShoppingBag, Trash2, X } from "lucide-react";
import type { ApiConfigDto, AppNoticeDto, FlowDto, KnowledgeEntryDto, UnrecognizedMessageDto } from "@/types/app";

type ChatDto = {
  id: string;
  user?: { phone: string; email: string; userId: string } | null;
  messages: { id: string; sender: string; content: string; createdAt: string }[];
  updatedAt: string;
};

type DashboardMetrics = { activeSessions: number; messages24h: number; openTickets: number; urgentTickets: number; unresolved: number; failedJobs: number; apiFailures: number };
type TicketDto = { id: string; orderId?: string | null; category: string; subject: string; description: string; status: string; priority: string; assignedTo?: string | null; updatedAt: string; messages: { id: string; sender: string; content: string }[] };
type IntentDto = { id: string; name: string; description?: string | null; examples: string; keywords: string; commandTemplate: string; requiresAuth: boolean; requiresConfirm: boolean; isActive: boolean };
type PushCampaignDto = { id: string; title: string; message: string; actionUrl?: string | null; recurrence: string; scheduledAt: string; nextRunAt?: string | null; lastSentAt?: string | null; status: string; segment: string; category: string; targetAccountKey?: string | null; maxPerDay: number; sentCount: number; failedCount: number };
type PushDeliveryDto = { id: string; campaignId?: string | null; subscriptionId: string; status: string; error?: string | null; sentAt?: string | null; clickedAt?: string | null; createdAt: string };
type PushCronRunDto = { id: string; status: string; processed: number; error?: string | null; startedAt: string; endedAt?: string | null };
type SiteSettingsDto = {
  siteName: string; logoUrl: string; avatarUrl: string; seoTitle: string; seoDescription: string; seoKeywords: string;
  canonicalUrl: string; ogTitle: string; ogDescription: string; ogImageUrl: string; twitterTitle: string;
  twitterDescription: string; twitterImageUrl: string; robotsIndex: boolean; robotsFollow: boolean;
  organizationName: string; organizationEmail: string; organizationPhone: string;
  googleAnalyticsId: string; googleTagManagerId: string; metaPixelId: string; googleSiteVerification: string;
  guestChatRetentionDays: number; memberChatRetentionDays: number; inactiveSessionRetentionDays: number;
  supportTicketRetentionDays: number; autoSubmitShoppingLinks: boolean; cashbackCacheSeconds: number;
  referralDomains: { domain: string; referralCode: string; enabled: boolean }[];
};
type FeedbackDto = { id: string; messageId?: string | null; rating: string; preview: string; createdAt: string };

const blankFlow: Omit<FlowDto, "id"> = {
  flowKey: "",
  title: "",
  triggerKeyword: "",
  botMessage: "",
  expectedInputType: "text",
  nextFlowKey: "",
  actionType: "STATIC_MESSAGE",
  apiId: null,
  isActive: true
};

const blankApi: Omit<ApiConfigDto, "id"> = {
  name: "",
  key: "",
  endpoint: "",
  method: "POST",
  headers: "{}",
  bodySample: "{}",
  description: "",
  isActive: true
};

const blankNotice: Omit<AppNoticeDto, "id"> = {
  title: "",
  message: "",
  displaySeconds: 10,
  isActive: true
};

const blankKnowledge: Omit<KnowledgeEntryDto, "id"> = {
  question: "",
  answer: "",
  keywords: "",
  category: "Chung",
  sourceLabel: "Trung tâm trợ giúp",
  sourceUrl: "",
  isActive: true
};

const blankIntent: Omit<IntentDto, "id"> = {
  name: "",
  description: "",
  examples: "[]",
  keywords: "[]",
  commandTemplate: "/huongdan",
  requiresAuth: false,
  requiresConfirm: false,
  isActive: true
};

export function AdminDashboard() {
  const [tab, setTab] = useState<"overview" | "analytics" | "pageAnalytics" | "tickets" | "training" | "feedback" | "notices" | "push" | "chats" | "settings" | "deployment">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notices, setNotices] = useState<AppNoticeDto[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntryDto[]>([]);
  const [unrecognized, setUnrecognized] = useState<UnrecognizedMessageDto[]>([]);
  const [feedback, setFeedback] = useState<FeedbackDto[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [chats, setChats] = useState<ChatDto[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsDto | null>(null);
  const [pushCampaigns, setPushCampaigns] = useState<PushCampaignDto[]>([]);
  const [pushSubscriptionCount, setPushSubscriptionCount] = useState(0);
  const [adminPushSubscriptionCount, setAdminPushSubscriptionCount] = useState(0);
  const [pushDeliveries, setPushDeliveries] = useState<PushDeliveryDto[]>([]);
  const [lastPushCronRun, setLastPushCronRun] = useState<PushCronRunDto | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function apiFetch(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const data = await readJson(response);
    if (response.status === 401) {
      window.location.href = "/admin/login";
      throw new Error(data.error ?? "Vui long dang nhap admin.");
    }
    if (!response.ok) throw new Error(data.error ?? "Yêu cầu thất bại.");
    return data;
  }

  async function loadAll() {
    const [dashboardData, ticketsData, knowledgeData, unrecognizedData, feedbackData, noticesData, pushData, chatsData, settingsData] = await Promise.all([
      apiFetch("/api/admin/dashboard"),
      apiFetch("/api/admin/tickets"),
      apiFetch("/api/admin/knowledge"),
      apiFetch("/api/admin/unrecognized"),
      apiFetch("/api/admin/feedback"),
      apiFetch("/api/admin/notices"),
      apiFetch("/api/admin/push-campaigns"),
      apiFetch("/api/admin/chats"),
      apiFetch("/api/admin/site-settings")
    ]);
    setMetrics(dashboardData.metrics);
    setTickets(ticketsData.tickets);
    setKnowledge(knowledgeData.entries);
    setUnrecognized(unrecognizedData.messages);
    setFeedback(feedbackData.feedback);
    setNotices(noticesData.notices);
    setPushCampaigns(pushData.campaigns);
    setPushSubscriptionCount(pushData.subscriptionCount);
    setAdminPushSubscriptionCount(pushData.adminSubscriptionCount);
    setPushDeliveries(pushData.deliveries);
    setLastPushCronRun(pushData.lastCronRun);
    setChats(chatsData.sessions);
    setSiteSettings(settingsData.settings);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: "Tổng quan", icon: History, group: "Theo dõi" },
        { id: "analytics", label: "Lượt lấy link & mua hàng", icon: BarChart3, group: "Theo dõi" },
        { id: "pageAnalytics", label: "Truy cập website", icon: BarChart3, group: "Theo dõi" },
        { id: "chats", label: "Lịch sử trò chuyện", icon: History, group: "Theo dõi" },
        { id: "tickets", label: "Yêu cầu hỗ trợ", icon: AlertCircle, group: "Người dùng" },
        { id: "feedback", label: "Đánh giá", icon: Bot, group: "Người dùng" },
        { id: "training", label: "Huấn luyện Em Ry", icon: BookOpen, group: "Nội dung chatbot" },
        { id: "notices", label: "Thông báo trong app", icon: Bell, group: "Gửi thông báo" },
        { id: "push", label: "Push theo lịch", icon: Clock3, group: "Gửi thông báo" },
        { id: "settings", label: "Thương hiệu & SEO", icon: Settings, group: "Hệ thống" },
        { id: "deployment", label: "Cập nhật phiên bản", icon: RefreshCw, group: "Hệ thống" }
      ] as const,
    []
  );

  return (
    <main className="min-h-dvh bg-neutral-50 text-brand-ink lg:pl-72">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-line bg-brand-dark px-4 text-white lg:hidden">
        <div><h1 className="font-semibold">Em Ry Admin</h1><p className="text-xs text-white/65">{tabs.find((item) => item.id === tab)?.label}</p></div>
        <button type="button" onClick={() => setSidebarOpen(true)} className="grid h-11 w-11 place-items-center rounded-lg border border-white/20" aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
      </header>

      {sidebarOpen ? <button type="button" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-dark text-white shadow-xl transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div><h1 className="text-lg font-bold">Em Ry Admin</h1><p className="text-xs text-white/60">Quản trị hệ thống</p></div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 lg:hidden" aria-label="Đóng menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="no-scrollbar flex-1 overflow-y-auto p-3">
          {Array.from(new Set(tabs.map((item) => item.group))).map((group) => (
            <div key={group} className="mb-4">
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{group}</p>
              <div className="grid gap-1">
                {tabs.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" onClick={() => { setTab(item.id); setSidebarOpen(false); }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium ${tab === item.id ? "bg-brand-red text-white shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                      <Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={logout} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" />Đăng xuất</button>
        </div>
      </aside>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {notice ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{notice}</p> : null}
        {tab === "overview" ? <OverviewPanel metrics={metrics} /> : null}
        {tab === "analytics" ? <LinkAnalyticsPanel /> : null}
        {tab === "pageAnalytics" ? <PageAnalyticsPanel /> : null}
        {tab === "tickets" ? <TicketsPanel tickets={tickets} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "training" ? <TrainingPanel entries={knowledge} messages={unrecognized} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "feedback" ? <FeedbackPanel items={feedback} /> : null}
        {tab === "notices" ? <NoticesPanel notices={notices} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "push" ? <PushCampaignsPanel campaigns={pushCampaigns} subscriptionCount={pushSubscriptionCount} adminSubscriptionCount={adminPushSubscriptionCount} deliveries={pushDeliveries} lastCronRun={lastPushCronRun} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "chats" ? <ChatsPanel chats={chats} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "settings" && siteSettings ? <SiteSettingsPanel settings={siteSettings} setSettings={setSiteSettings} setNotice={setNotice} /> : null}
        {tab === "deployment" ? <DeploymentPanel /> : null}
      </section>
    </main>
  );
}

type LinkAnalyticsDto = {
  periods: Record<"total" | "today" | "week" | "month", { created: number; clicked: number }>;
  events: {
    id: string;
    accountKey?: string | null;
    userName: string;
    email: string;
    phone: string;
    platform: string;
    sourceUrl: string;
    affiliateUrl: string;
    productName: string;
    productImage: string;
    productPrice?: string | number | null;
    cashbackAmount?: string | number | null;
    createdAt: string;
    clickCount: number;
    lastClickedAt?: string | null;
  }[];
};

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

function formatAdminMoney(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "Đang cập nhật";
  if (typeof value === "number") return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  const text = String(value).trim();
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(text)
    ? text.replace(/\./g, "")
    : /^\d{1,3}(,\d{3})+$/.test(text)
      ? text.replace(/,/g, "")
      : text;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? `${new Intl.NumberFormat("vi-VN").format(amount)}đ` : text;
}

function LinkAnalyticsPanel() {
  const [data, setData] = useState<LinkAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [, refreshClock] = useState(0);

  async function load() {
    try {
      setData(await fetchJson("/api/admin/link-analytics") as LinkAnalyticsDto);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thống kê.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => refreshClock((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const events = (data?.events ?? []).filter((event) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [event.userName, event.email, event.phone, event.productName, event.sourceUrl, event.platform].some((value) => value.toLowerCase().includes(query));
  });
  const periodCards = [
    { key: "today", label: "Hôm nay" },
    { key: "week", label: "Tuần này" },
    { key: "month", label: "Tháng này" },
    { key: "total", label: "Tổng cộng" }
  ] as const;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-bold">Lượt lấy link & chuyển sang sàn</h2><p className="mt-1 text-sm text-neutral-500">Theo dõi người dùng tạo link hoàn tiền và bấm quay lại Shopee/TikTok Shop.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button>
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {periodCards.map(({ key, label }) => {
          const values = data?.periods[key] ?? { created: 0, clicked: 0 };
          const rate = values.created ? Math.round(values.clicked / values.created * 100) : 0;
          return (
            <article key={key} className="rounded-xl border border-brand-line bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-600">{label}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-50 p-2.5"><Link2 className="h-4 w-4 text-emerald-700" /><strong className="mt-1 block text-2xl text-emerald-800">{values.created}</strong><span className="text-[11px] text-emerald-700">Lượt lấy link</span></div>
                <div className="rounded-lg bg-blue-50 p-2.5"><MousePointerClick className="h-4 w-4 text-blue-700" /><strong className="mt-1 block text-2xl text-blue-800">{values.clicked}</strong><span className="text-[11px] text-blue-700">Bấm sang sàn</span></div>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Tỷ lệ bấm: <strong className="text-brand-ink">{rate}%</strong></p>
            </article>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm">
        <div className="border-b border-brand-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-semibold">Các link đã tạo gần đây</h3><p className="text-xs text-neutral-500">Mỗi link chỉ hiện một lần, kèm giá sản phẩm, hoa hồng dự kiến và tổng lượt bấm sang sàn.</p></div>
          </div>
          <label className="relative mt-3 block"><Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, email, số điện thoại, sản phẩm hoặc link…" className="h-10 w-full rounded-lg border border-brand-line pl-9 pr-3 text-sm outline-none focus:border-brand-red" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed text-left">
            <thead className="border-b border-brand-line bg-neutral-50/80 text-xs font-semibold text-neutral-500">
              <tr>
                <th className="w-[70px] px-4 py-3">ID</th>
                <th className="w-[210px] px-4 py-3">Thành viên</th>
                <th className="w-[130px] px-4 py-3">Nền tảng</th>
                <th className="w-[110px] px-4 py-3 text-center">Lượt click link</th>
                <th className="w-[280px] px-4 py-3">Sản phẩm</th>
                <th className="w-[170px] px-4 py-3 text-right">Giá / HH dự kiến</th>
                <th className="w-[110px] px-4 py-3 text-center">Affiliate Link</th>
                <th className="w-[170px] px-4 py-3 text-right">Thời gian click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {events.map((event, index) => (
                <tr key={event.id} className="align-middle transition hover:bg-neutral-50/70">
                  <td className="px-4 py-3 text-xs font-semibold text-neutral-500">#{events.length - index}</td>
                  <td className="px-4 py-3">
                    <p className="truncate text-sm font-semibold">{event.userName || event.email || event.phone || "Khách chưa rõ tên"}</p>
                    <p className="mt-0.5 truncate text-[11px] text-neutral-400">{event.email || event.phone || event.accountKey || "Không có thông tin"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex min-w-[94px] justify-center rounded-full px-3 py-1.5 text-xs font-bold text-white ${event.platform === "tiktok" ? "bg-[#20242a]" : "bg-[#ee4d2d]"}`}>
                      {event.platform === "tiktok" ? "TikTok Shop" : "Shopee"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <strong className="text-sm text-blue-700">{event.clickCount}</strong>
                    <span className="ml-1 text-[11px] text-neutral-400">lượt</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {event.productImage ? <img src={event.productImage} alt="" className="h-11 w-11 shrink-0 rounded-lg border object-cover" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-400"><ShoppingBag className="h-4 w-4" /></span>}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{event.productName || "Sản phẩm chưa có tên"}</p>
                        {event.sourceUrl ? <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-[11px] text-neutral-400 hover:text-blue-600 hover:underline">Xem link sản phẩm</a> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="block text-xs font-medium text-neutral-500">{formatAdminMoney(event.productPrice)}</span>
                    <strong className="mt-1 block text-sm text-emerald-700">{event.cashbackAmount !== undefined && event.cashbackAmount !== null && event.cashbackAmount !== "" ? `+${formatAdminMoney(event.cashbackAmount)}` : "Đang cập nhật"}</strong>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {event.affiliateUrl ? <a href={event.affiliateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">Mở link <ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-xs text-neutral-400">Chưa có</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="block text-xs font-medium text-neutral-600">{new Date(event.lastClickedAt || event.createdAt).toLocaleString("vi-VN")}</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-400">{event.lastClickedAt ? relativeTime(event.lastClickedAt) : "Chưa có lượt click"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !events.length ? <p className="p-8 text-center text-sm text-neutral-500">Chưa có hoạt động phù hợp.</p> : null}
          {loading ? <p className="p-8 text-center text-sm text-neutral-500">Đang tải thống kê…</p> : null}
        </div>
      </section>
    </div>
  );
}

type PageAnalyticsDto = {
  pages: {
    path: string;
    visits: number;
    uniqueVisitors: number;
    averageDurationSeconds: number;
    interactionRate: number;
    registrations: number;
    registrationRate: number;
    sources: { name: string; count: number }[];
  }[];
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} giây`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} phút ${remainder} giây` : `${minutes} phút`;
}

function PageAnalyticsPanel() {
  const [data, setData] = useState<PageAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("month");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setData(await fetchJson(`/api/admin/page-analytics?period=${period}`) as PageAnalyticsDto);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thống kê truy cập.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [period]);

  async function clearAnalytics() {
    if (!window.confirm("Xóa toàn bộ dữ liệu truy cập website và số đăng ký đã thống kê? Thao tác này không thể hoàn tác.")) return;
    setDeleting(true);
    try {
      const result = await fetchJson("/api/admin/page-analytics", { method: "DELETE" }) as { deleted?: number };
      await load();
      setError("");
      window.alert(`Đã xóa ${result.deleted ?? 0} bản ghi thống kê.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa dữ liệu thống kê.");
    } finally {
      setDeleting(false);
    }
  }

  const pages = data?.pages ?? [];
  const totals = pages.reduce((result, page) => ({
    visits: result.visits + page.visits,
    visitors: result.visitors + page.uniqueVisitors,
    registrations: result.registrations + page.registrations
  }), { visits: 0, visitors: 0, registrations: 0 });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-bold">Thống kê truy cập website</h2><p className="mt-1 text-sm text-neutral-500">Trang được xem nhiều, nguồn truy cập, thời gian ở lại, tương tác và đăng ký thành công.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} disabled={loading || deleting} className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới</button>
          <button type="button" onClick={() => void clearAnalytics()} disabled={loading || deleting} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deleting ? "Đang xóa…" : "Xóa dữ liệu"}</button>
        </div>
      </div>
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex w-fit flex-wrap rounded-xl border border-brand-line bg-white p-1">
        {([
          ["day", "24 giờ"],
          ["week", "7 ngày"],
          ["month", "30 ngày"],
          ["all", "Tất cả"]
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`h-9 rounded-lg px-3 text-sm font-semibold transition ${period === value ? "bg-brand-dark text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-brand-line bg-white p-4"><span className="text-xs text-neutral-500">Tổng lượt truy cập</span><strong className="mt-1 block text-2xl">{totals.visits}</strong></article>
        <article className="rounded-xl border border-brand-line bg-white p-4"><span className="text-xs text-neutral-500">Người truy cập</span><strong className="mt-1 block text-2xl">{totals.visitors}</strong></article>
        <article className="rounded-xl border border-brand-line bg-white p-4"><span className="text-xs text-neutral-500">Đăng ký thành công</span><strong className="mt-1 block text-2xl text-emerald-700">{totals.registrations}</strong></article>
      </div>
      <section className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-brand-line bg-neutral-50 text-xs font-semibold text-neutral-500">
              <tr>
                <th className="px-4 py-3">Trang</th>
                <th className="px-4 py-3 text-center">Lượt truy cập</th>
                <th className="px-4 py-3 text-center">Người truy cập</th>
                <th className="px-4 py-3">Nguồn truy cập</th>
                <th className="px-4 py-3 text-center">Ở lại trung bình</th>
                <th className="px-4 py-3 text-center">Có tương tác</th>
                <th className="px-4 py-3 text-center">Đăng ký thành công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {pages.map((page) => (
                <tr key={page.path} className="hover:bg-neutral-50/70">
                  <td className="px-4 py-3"><a href={page.path} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">{page.path}</a></td>
                  <td className="px-4 py-3 text-center font-semibold">{page.visits}</td>
                  <td className="px-4 py-3 text-center">{page.uniqueVisitors}</td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                      {page.sources.slice(0, 4).map((source) => <span key={source.name} className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600">{source.name}: <strong>{source.count}</strong></span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{formatDuration(page.averageDurationSeconds)}</td>
                  <td className="px-4 py-3 text-center"><strong className={page.interactionRate > 0 ? "text-blue-700" : "text-neutral-400"}>{page.interactionRate}%</strong></td>
                  <td className="px-4 py-3 text-center">
                    <strong className={page.registrations > 0 ? "text-emerald-700" : "text-neutral-400"}>{page.registrations > 0 ? `${page.registrations} (${page.registrationRate}%)` : "Chưa có"}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !pages.length ? <p className="p-8 text-center text-sm text-neutral-500">Chưa có dữ liệu. Lượt truy cập mới sẽ bắt đầu được ghi nhận từ bây giờ.</p> : null}
          {loading ? <p className="p-8 text-center text-sm text-neutral-500">Đang tải thống kê…</p> : null}
        </div>
      </section>
      <p className="text-xs leading-5 text-neutral-500">“Có tương tác” được ghi nhận khi khách nhấp, nhập nội dung, cuộn trang hoặc dùng bàn phím. Thời gian ở lại được cập nhật định kỳ trong lúc trang đang mở.</p>
    </div>
  );
}

type DeploymentDto = {
  enabled: boolean;
  platformSupported: boolean;
  currentCommit: string;
  deployment: {
    status: "idle" | "running" | "restarting" | "success" | "failed";
    message: string;
    logs?: string[];
    updatedAt?: string;
  };
};

function DeploymentPanel() {
  const [data, setData] = useState<DeploymentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const updateStarted = useRef(false);
  const active = data?.deployment.status === "running" || data?.deployment.status === "restarting";

  async function load() {
    try {
      setData(await fetchJson("/api/admin/deployment") as DeploymentDto);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể kiểm tra phiên bản.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!updateStarted.current || data?.deployment.status !== "success") return;
    updateStarted.current = false;
    const url = new URL(window.location.href);
    url.searchParams.set("updated", Date.now().toString());
    window.location.replace(url.toString());
  }, [data?.deployment.status]);

  async function update() {
    if (!window.confirm("Cập nhật website lên phiên bản mới nhất từ GitHub? Website có thể gián đoạn vài giây khi khởi động lại.")) return;
    setStarting(true);
    updateStarted.current = true;
    setError("");
    try {
      await fetchJson("/api/admin/deployment", { method: "POST", body: "{}" });
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Không thể bắt đầu cập nhật.");
    } finally {
      setStarting(false);
    }
  }

  const statusLabel = {
    idle: "Chưa cập nhật", running: "Đang cập nhật", restarting: "Đang khởi động lại",
    success: "Thành công", failed: "Thất bại"
  }[data?.deployment.status ?? "idle"];

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">Cập nhật website</h2>
        <p className="mt-1 text-sm text-neutral-500">Tải phiên bản mới từ GitHub, build và tự khởi động lại website.</p>
      </div>
      <div className="rounded-xl border border-brand-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-neutral-50 p-3"><span className="text-xs text-neutral-500">Phiên bản đang chạy</span><strong className="mt-1 block font-mono text-sm">{data?.currentCommit ?? "Đang kiểm tra…"}</strong></div>
          <div className="rounded-lg bg-neutral-50 p-3"><span className="text-xs text-neutral-500">Trạng thái</span><strong className="mt-1 block text-sm">{loading ? "Đang kiểm tra…" : statusLabel}</strong></div>
          <div className="rounded-lg bg-neutral-50 p-3"><span className="text-xs text-neutral-500">Cập nhật gần nhất</span><strong className="mt-1 block text-sm">{data?.deployment.updatedAt ? new Date(data.deployment.updatedAt).toLocaleString("vi-VN") : "Chưa có"}</strong></div>
        </div>
        {data?.deployment.message ? <p className={`mt-4 rounded-lg p-3 text-sm ${data.deployment.status === "failed" ? "bg-red-50 text-red-700" : data.deployment.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{data.deployment.message}</p> : null}
        {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {!data?.enabled ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Thêm <code>ADMIN_DEPLOY_ENABLED=&quot;true&quot;</code> vào <code>.env.production</code>, sau đó restart PM2 để bật chức năng.</p> : null}
        {data && !data.platformSupported ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Chỉ có thể chạy cập nhật trên server Linux.</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={update} disabled={loading || starting || active || !data?.enabled || !data?.platformSupported} className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-red px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${starting || active ? "animate-spin" : ""}`} />
            {starting || active ? "Đang cập nhật…" : "Cập nhật phiên bản mới"}
          </button>
          <button type="button" onClick={() => void load()} disabled={loading} className="h-11 rounded-lg border border-brand-line px-4 text-sm font-semibold disabled:opacity-50">Kiểm tra lại</button>
        </div>
      </div>
      {data?.deployment.logs?.length ? (
        <details className="rounded-xl border border-brand-line bg-neutral-950 p-4 text-neutral-100">
          <summary className="cursor-pointer text-sm font-semibold">Xem nhật ký cập nhật</summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5">{data.deployment.logs.join("\n")}</pre>
        </details>
      ) : null}
    </div>
  );
}

function PushCampaignsPanel({
  campaigns,
  subscriptionCount,
  adminSubscriptionCount,
  deliveries,
  lastCronRun,
  reload,
  setNotice
}: {
  campaigns: PushCampaignDto[];
  subscriptionCount: number;
  adminSubscriptionCount: number;
  deliveries: PushDeliveryDto[];
  lastCronRun: PushCronRunDto | null;
  reload: () => Promise<void>;
  setNotice: (value: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("https://tranquan.vn/");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const next = new Date(Date.now() + 10 * 60 * 1000);
    next.setSeconds(0, 0);
    return new Date(next.getTime() - next.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [recurrence, setRecurrence] = useState<"ONCE" | "DAILY">("ONCE");
  const [segment, setSegment] = useState<"ALL" | "ADMIN" | "INACTIVE_3D" | "ACCOUNT">("ALL");
  const [category, setCategory] = useState<"REMINDER" | "ORDER" | "CASHBACK" | "SUPPORT">("REMINDER");
  const [targetAccountKey, setTargetAccountKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [cronWorking, setCronWorking] = useState(false);
  const [cronCopied, setCronCopied] = useState(false);
  const [cronSetup, setCronSetup] = useState<{ configured: boolean; endpoint: string; command: string } | null>(null);

  useEffect(() => {
    void fetchJson("/api/admin/push-cron").then(setCronSetup).catch(() => null);
  }, []);

  async function runCronNow() {
    setCronWorking(true);
    setNotice("");
    try {
      const data = await fetchJson("/api/admin/push-cron", { method: "POST", body: "{}" });
      setNotice(`Cron chạy thành công. Đã xử lý ${data.processed ?? 0} lịch đến hạn.`);
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể chạy thử cron.");
    } finally {
      setCronWorking(false);
    }
  }

  async function copyCronCommand() {
    if (!cronSetup?.command) return;
    try {
      await navigator.clipboard.writeText(cronSetup.command);
      setCronCopied(true);
      window.setTimeout(() => setCronCopied(false), 2500);
    } catch {
      setNotice("Không thể sao chép. Hãy mở Admin bằng HTTPS rồi thử lại.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      await fetchJson("/api/admin/push-campaigns", {
        method: "POST",
        body: JSON.stringify({ title, message, actionUrl, recurrence, scheduledAt: new Date(scheduledAt).toISOString(), segment, category, targetAccountKey, maxPerDay: 2 })
      });
      setTitle("");
      setMessage("");
      setNotice("Đã tạo lịch gửi thông báo.");
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể tạo lịch gửi.");
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, action: "send-now" | "cancel" | "test-admin") {
    setWorkingId(id);
    setNotice("");
    try {
      const data = await fetchJson("/api/admin/push-campaigns", { method: "PATCH", body: JSON.stringify({ id, action }) });
      setNotice(action === "cancel" ? "Đã hủy lịch gửi." : `Đã gửi: ${data.result?.sent ?? 0} thành công, ${data.result?.failed ?? 0} thất bại, ${data.result?.skipped ?? 0} bỏ qua.`);
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xử lý thông báo.");
    } finally {
      setWorkingId("");
    }
  }

  async function enableAdminPush() {
    setSaving(true);
    setNotice("");
    try {
      const push = await import("@/lib/web-push-client");
      const subscription = await push.registerForPushNotifications();
      const response = await fetch("/api/admin/push-subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error ?? "Không thể đăng ký thiết bị admin.");
      setNotice("Đã đăng ký thiết bị admin để nhận thông báo thử.");
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể bật thông báo admin.");
    } finally {
      setSaving(false);
    }
  }

  function reuseCampaign(campaign: PushCampaignDto) {
    setTitle(campaign.title);
    setMessage(campaign.message);
    setActionUrl(campaign.actionUrl || "https://tranquan.vn/");
    setSegment(campaign.segment as typeof segment);
    setCategory(campaign.category as typeof category);
    setTargetAccountKey(campaign.targetAccountKey || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportPushReport() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), campaigns, deliveries, lastCronRun }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `push-report-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const successfulDeliveries = deliveries.filter((item) => item.status === "SENT").length;
  const clickedDeliveries = deliveries.filter((item) => item.clickedAt).length;
  const clickRate = successfulDeliveries ? Math.round((clickedDeliveries / successfulDeliveries) * 1000) / 10 : 0;
  const cronIsStale = !lastCronRun || Date.now() - new Date(lastCronRun.startedAt).getTime() > 5 * 60 * 1000;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Thiết bị người dùng</p><strong className="mt-1 block text-3xl text-emerald-700">{subscriptionCount}</strong></div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm text-blue-800">Thiết bị test admin</p><strong className="mt-1 block text-3xl text-blue-700">{adminSubscriptionCount}</strong><button type="button" onClick={enableAdminPush} disabled={saving} className="mt-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Đăng ký máy này</button></div>
        <div className={`rounded-xl border p-4 ${lastCronRun?.status === "FAILED" || cronIsStale ? "border-red-200 bg-red-50" : "border-neutral-200 bg-neutral-50"}`}><p className="text-sm text-neutral-700">Cron gần nhất</p><strong className="mt-1 block text-base">{lastCronRun ? `${lastCronRun.status} · ${new Date(lastCronRun.startedAt).toLocaleString("vi-VN")}` : "Chưa chạy"}</strong>{cronIsStale ? <p className="mt-1 text-xs font-semibold text-red-700">Cron đã quá 5 phút chưa chạy.</p> : null}{lastCronRun?.error ? <p className="mt-1 text-xs text-red-700">{lastCronRun.error}</p> : null}</div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-800">Tỷ lệ mở gần đây</p><strong className="mt-1 block text-3xl text-amber-700">{clickRate}%</strong><button type="button" onClick={exportPushReport} className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800">Xuất báo cáo</button></div>
      </div>

      <section className="rounded-xl border border-brand-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Cài đặt cron gửi thông báo</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">Cron gọi hệ thống mỗi phút để gửi đúng các thông báo đã lên lịch.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cronSetup?.configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
            {cronSetup?.configured ? "Đã có CRON_SECRET" : "Chưa cấu hình CRON_SECRET"}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-neutral-50 p-3 text-sm"><strong>1. Cấu hình mã bí mật</strong><p className="mt-1 text-xs leading-5 text-neutral-600">Thêm <code>CRON_SECRET</code> vào <code>.env.production</code> và restart PM2.</p></div>
          <div className="rounded-lg bg-neutral-50 p-3 text-sm"><strong>2. Cài lịch mỗi phút</strong><p className="mt-1 text-xs leading-5 text-neutral-600">Sao chép lệnh, dán vào cửa sổ SSH của server và chạy một lần.</p></div>
          <div className="rounded-lg bg-neutral-50 p-3 text-sm"><strong>3. Chạy thử</strong><p className="mt-1 text-xs leading-5 text-neutral-600">Bấm chạy thử rồi kiểm tra ô “Cron gần nhất” ở phía trên.</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void copyCronCommand()} disabled={!cronSetup?.command} className="inline-flex h-11 items-center gap-2 rounded-lg border border-brand-line px-4 text-sm font-semibold disabled:opacity-50">
            {cronCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <ClipboardCopy className="h-4 w-4" />}
            {cronCopied ? "Đã sao chép lệnh" : "Sao chép lệnh cài cron"}
          </button>
          <button type="button" onClick={() => void runCronNow()} disabled={cronWorking} className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-red px-4 text-sm font-semibold text-white disabled:opacity-50">
            {cronWorking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {cronWorking ? "Đang chạy cron…" : "Chạy thử cron ngay"}
          </button>
        </div>
        {cronSetup?.endpoint ? <p className="mt-3 break-all text-xs text-neutral-500">Endpoint: <code>{cronSetup.endpoint}</code></p> : null}
      </section>

      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-brand-line bg-white p-4 shadow-sm">
        <div>
          <h2 className="font-semibold">Tạo lịch nhắc mọi người</h2>
          <p className="text-xs text-neutral-500">Giờ được nhập theo múi giờ trên thiết bị quản trị.</p>
        </div>
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Tiêu đề thông báo" className="h-11 rounded-lg border border-brand-line px-3 text-sm outline-none focus:border-brand-red" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={1000} rows={3} placeholder="Nội dung nhắc..." className="rounded-lg border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-red" />
        <input value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} type="url" placeholder="Link mở khi bấm thông báo" className="h-11 rounded-lg border border-brand-line px-3 text-sm outline-none focus:border-brand-red" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Ngày giờ gửi<input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" required className="h-11 rounded-lg border border-brand-line px-3 font-normal" /></label>
          <label className="grid gap-1 text-sm font-medium">Lặp lại<select value={recurrence} onChange={(event) => setRecurrence(event.target.value as "ONCE" | "DAILY")} className="h-11 rounded-lg border border-brand-line px-3 font-normal"><option value="ONCE">Chỉ gửi một lần</option><option value="DAILY">Lặp hằng ngày</option></select></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Nhóm người nhận<select value={segment} onChange={(event) => setSegment(event.target.value as typeof segment)} className="h-11 rounded-lg border border-brand-line px-3 font-normal"><option value="ALL">Tất cả người dùng</option><option value="ADMIN">Chỉ thiết bị admin</option><option value="INACTIVE_3D">Không hoạt động 3 ngày</option><option value="ACCOUNT">Một tài khoản</option></select></label>
          <label className="grid gap-1 text-sm font-medium">Loại thông báo<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-11 rounded-lg border border-brand-line px-3 font-normal"><option value="REMINDER">Nhắc mua hàng</option><option value="ORDER">Đơn hàng</option><option value="CASHBACK">Tiền hoàn</option><option value="SUPPORT">Hỗ trợ</option></select></label>
        </div>
        {segment === "ACCOUNT" ? <input value={targetAccountKey} onChange={(event) => setTargetAccountKey(event.target.value)} required placeholder="Account key người nhận" className="h-11 rounded-lg border border-brand-line px-3 text-sm" /> : null}
        <button disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-red px-5 font-semibold text-white disabled:opacity-60">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
          {saving ? "Đang lưu..." : "Đặt lịch gửi"}
        </button>
      </form>

      <div className="grid gap-3">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-xl border border-brand-line bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{campaign.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-600">{campaign.message}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {campaign.recurrence === "DAILY" ? "Hằng ngày" : "Một lần"} · {campaign.segment} · {campaign.category} · Lần tới: {campaign.nextRunAt ? new Date(campaign.nextRunAt).toLocaleString("vi-VN") : "—"} · {campaign.status}
                </p>
                <p className="mt-1 text-xs text-neutral-500">Đã gửi {campaign.sentCount} · Lỗi {campaign.failedCount}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => reuseCampaign(campaign)} className="rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700">Dùng lại</button>
                <button type="button" onClick={() => act(campaign.id, "test-admin")} disabled={workingId === campaign.id || adminSubscriptionCount < 1} className="rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-700 disabled:opacity-40">Gửi thử</button>
                <button type="button" onClick={() => act(campaign.id, "send-now")} disabled={workingId === campaign.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">
                  {workingId === campaign.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gửi ngay
                </button>
                {campaign.status === "ACTIVE" ? <button type="button" onClick={() => act(campaign.id, "cancel")} disabled={workingId === campaign.id} className="rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50">Hủy</button> : null}
              </div>
            </div>
          </article>
        ))}
        {!campaigns.length ? <p className="rounded-xl border border-dashed p-4 text-sm text-neutral-500">Chưa có lịch thông báo nào.</p> : null}
      </div>

      <div className="rounded-xl border border-brand-line bg-white p-4">
        <h2 className="font-semibold">Nhật ký gửi gần đây</h2>
        <div className="mt-3 grid gap-2">
          {deliveries.slice(0, 30).map((delivery) => (
            <div key={delivery.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs">
              <div className="flex flex-wrap justify-between gap-2"><strong className={delivery.status === "FAILED" ? "text-red-700" : "text-emerald-700"}>{delivery.status}</strong><span>{new Date(delivery.createdAt).toLocaleString("vi-VN")}</span></div>
              <p className="mt-1 text-neutral-500">Mở: {delivery.clickedAt ? new Date(delivery.clickedAt).toLocaleString("vi-VN") : "chưa"}{delivery.error ? ` · Lỗi: ${delivery.error}` : ""}</p>
            </div>
          ))}
          {!deliveries.length ? <p className="text-sm text-neutral-500">Chưa có lượt gửi nào.</p> : null}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({ metrics }: { metrics: DashboardMetrics | null }) {
  if (!metrics) return <p className="text-sm text-neutral-500">Đang tải số liệu...</p>;
  const cards = [
    ["Phiên hoạt động 24h", metrics.activeSessions],
    ["Tin nhắn 24h", metrics.messages24h],
    ["Ticket đang mở", metrics.openTickets],
    ["Ticket ưu tiên", metrics.urgentTickets],
    ["Câu Ry chưa hiểu", metrics.unresolved],
    ["API lỗi 24h", metrics.apiFailures],
    ["Job thất bại", metrics.failedJobs]
  ];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <article key={String(label)} className="rounded-xl border border-brand-line bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">{label}</p><strong className="mt-2 block text-3xl text-brand-red">{value}</strong></article>)}</div>;
}

function TicketsPanel({ tickets, reload, setNotice }: { tickets: TicketDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  const [replies, setReplies] = useState<Record<string, string>>({});
  async function update(ticket: TicketDto, status?: string) {
    try {
      await fetchJson("/api/admin/tickets", { method: "PATCH", body: JSON.stringify({ id: ticket.id, status, reply: replies[ticket.id] || undefined }) });
      setReplies({ ...replies, [ticket.id]: "" });
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể cập nhật ticket.");
    }
  }
  return <div className="grid gap-3">{tickets.map((ticket) => <article key={ticket.id} className="rounded-lg border border-brand-line p-4"><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{ticket.subject}</h2><p className="text-xs text-neutral-500">#{ticket.id.slice(-8)} · {ticket.category} · {ticket.priority} · {ticket.status}</p></div><select value={ticket.status} onChange={(event) => update(ticket, event.target.value)} className="h-9 rounded-md border border-brand-line px-2 text-sm"><option value="NEW">Mới</option><option value="IN_PROGRESS">Đang xử lý</option><option value="WAITING_USER">Chờ người dùng</option><option value="RESOLVED">Đã giải quyết</option><option value="CLOSED">Đã đóng</option></select></div><p className="mt-3 whitespace-pre-line text-sm">{ticket.description}</p><div className="mt-3 grid gap-2 rounded-lg bg-neutral-50 p-3">{ticket.messages.map((message) => <p key={message.id} className="text-sm"><strong>{message.sender.startsWith("ADMIN") ? "Admin" : "Người dùng"}:</strong> {message.content}</p>)}</div><div className="mt-3 flex gap-2"><input value={replies[ticket.id] ?? ""} onChange={(event) => setReplies({ ...replies, [ticket.id]: event.target.value })} placeholder="Nhập phản hồi..." className="h-10 min-w-0 flex-1 rounded-md border border-brand-line px-3 text-sm" /><button onClick={() => update(ticket, "WAITING_USER")} disabled={!replies[ticket.id]?.trim()} className="rounded-md bg-brand-red px-4 text-sm font-semibold text-white disabled:opacity-50">Gửi</button></div></article>)}{!tickets.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-neutral-500">Chưa có ticket hỗ trợ.</p> : null}</div>;
}

function IntentsPanel({ intents, reload, setNotice }: { intents: IntentDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  const [editing, setEditing] = useState<(Partial<IntentDto> & { id?: string }) | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      await fetchJson(editing.id ? `/api/admin/intents/${editing.id}` : "/api/admin/intents", { method: editing.id ? "PUT" : "POST", body: JSON.stringify(editing) });
      setEditing(null);
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu intent.");
    }
  }
  async function remove(id: string) { await fetchJson(`/api/admin/intents/${id}`, { method: "DELETE" }); await reload(); }
  return <div className="grid gap-4 lg:grid-cols-[1fr_380px]"><div className="grid gap-3"><button onClick={() => setEditing(blankIntent)} className="flex h-11 w-fit items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Plus className="h-4 w-4" /> Thêm intent</button>{intents.map((intent) => <article key={intent.id} className="rounded-lg border border-brand-line p-4"><div className="flex justify-between gap-3"><div><h2 className="font-semibold">{intent.name}</h2><p className="text-xs text-neutral-500">{intent.commandTemplate} · {intent.isActive ? "Bật" : "Tắt"}</p></div><div className="flex gap-2"><button onClick={() => setEditing(intent)} className="rounded-md border px-3 text-sm">Sửa</button><button onClick={() => remove(intent.id)} className="grid h-9 w-9 place-items-center rounded-md border text-red-600"><Trash2 className="h-4 w-4" /></button></div></div><p className="mt-2 text-sm text-neutral-600">{intent.description}</p></article>)}</div>{editing ? <form onSubmit={submit} className="rounded-lg border border-brand-line p-4"><h2 className="mb-3 font-semibold">Intent động</h2><TextInput label="Tên (VIẾT_HOA)" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v.toUpperCase() })} /><TextArea label="Mô tả" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} /><TextArea label='Câu ví dụ JSON, ví dụ ["kiểm tra ví"]' value={editing.examples ?? "[]"} onChange={(v) => setEditing({ ...editing, examples: v })} /><TextArea label='Từ khóa JSON' value={editing.keywords ?? "[]"} onChange={(v) => setEditing({ ...editing, keywords: v })} /><TextInput label="Command an toàn" value={editing.commandTemplate ?? ""} onChange={(v) => setEditing({ ...editing, commandTemplate: v })} /><Toggle checked={Boolean(editing.requiresAuth)} label="Cần đăng nhập" onChange={(value) => setEditing({ ...editing, requiresAuth: value })} /><Toggle checked={Boolean(editing.requiresConfirm)} label="Cần xác nhận" onChange={(value) => setEditing({ ...editing, requiresConfirm: value })} /><Toggle checked={Boolean(editing.isActive)} label="Bật intent" onChange={(value) => setEditing({ ...editing, isActive: value })} /><div className="mt-4 flex gap-2"><button className="rounded-md bg-brand-red px-4 py-2 font-semibold text-white">Lưu</button><button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2">Hủy</button></div></form> : null}</div>;
}

function FlowsPanel({ flows, apis, reload, setNotice }: { flows: FlowDto[]; apis: ApiConfigDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  const [editing, setEditing] = useState<(Partial<FlowDto> & { id?: string }) | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/admin/flows/${editing.id}` : "/api/admin/flows";
      await fetchJson(url, { method, body: JSON.stringify(editing) });
      setEditing(null);
      await reload();
      setNotice("Đã lưu kịch bản.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu.");
    }
  }

  async function remove(id: string) {
    await fetchJson(`/api/admin/flows/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-3">
        <button onClick={() => setEditing(blankFlow)} className="flex h-11 w-fit items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white">
          <Plus className="h-4 w-4" /> Thêm kịch bản
        </button>
        {flows.map((flow) => (
          <article key={flow.id} className="rounded-lg border border-brand-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{flow.title}</h2>
                <p className="text-xs text-neutral-500">
                  {flow.flowKey} · {flow.actionType ?? "STATIC_MESSAGE"} · {flow.isActive ? "Bật" : "Tắt"}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(flow)} className="h-9 rounded-md border border-brand-line px-3 text-sm">Sửa</button>
                <button onClick={() => remove(flow.id)} className="grid h-9 w-9 place-items-center rounded-md border border-brand-line text-red-600" title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{flow.botMessage}</p>
          </article>
        ))}
      </div>
      {editing ? <FlowForm editing={editing} setEditing={setEditing} apis={apis} submit={submit} /> : null}
    </div>
  );
}

function FlowForm({ editing, setEditing, apis, submit }: { editing: Partial<FlowDto>; setEditing: (value: Partial<FlowDto> | null) => void; apis: ApiConfigDto[]; submit: (event: FormEvent) => void }) {
  return (
    <form onSubmit={submit} className="rounded-lg border border-brand-line p-4">
      <h2 className="mb-3 font-semibold">Kịch bản</h2>
      <TextInput label="Flow key" value={editing.flowKey ?? ""} onChange={(v) => setEditing({ ...editing, flowKey: v })} />
      <TextInput label="Tiêu đề" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
      <TextInput label="Trigger keyword" value={editing.triggerKeyword ?? ""} onChange={(v) => setEditing({ ...editing, triggerKeyword: v })} />
      <TextArea label="Bot message" value={editing.botMessage ?? ""} onChange={(v) => setEditing({ ...editing, botMessage: v })} />
      <TextInput label="Expected input type" value={editing.expectedInputType ?? ""} onChange={(v) => setEditing({ ...editing, expectedInputType: v })} />
      <TextInput label="Next flow key" value={editing.nextFlowKey ?? ""} onChange={(v) => setEditing({ ...editing, nextFlowKey: v })} />
      <Select label="Action" value={editing.actionType ?? "STATIC_MESSAGE"} onChange={(v) => setEditing({ ...editing, actionType: v })} options={["SHOW_MENU", "CONVERT_LINK", "API_CALL", "STATIC_MESSAGE"]} />
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium">API</span>
        <select value={editing.apiId ?? ""} onChange={(event) => setEditing({ ...editing, apiId: event.target.value || null })} className="h-10 w-full rounded-md border border-brand-line px-3">
          <option value="">Không dùng API</option>
          {apis.map((api) => <option key={api.id} value={api.id}>{api.name}</option>)}
        </select>
      </label>
      <Toggle checked={Boolean(editing.isActive)} label="Bật kịch bản" onChange={(value) => setEditing({ ...editing, isActive: value })} />
      <div className="mt-4 flex gap-2">
        <button className="flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Save className="h-4 w-4" /> Lưu</button>
        <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-md border border-brand-line px-4">Hủy</button>
      </div>
    </form>
  );
}

function ApisPanel({ apis, reload, setNotice }: { apis: ApiConfigDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  const [editing, setEditing] = useState<(Partial<ApiConfigDto> & { id?: string }) | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/admin/apis/${editing.id}` : "/api/admin/apis";
      await fetchJson(url, { method, body: JSON.stringify(editing) });
      setEditing(null);
      await reload();
      setNotice("Đã lưu API.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu API.");
    }
  }

  async function remove(id: string) {
    try {
      await fetchJson(`/api/admin/apis/${id}`, { method: "DELETE" });
      await reload();
      setNotice("Đã xóa API.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa API.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-3">
        <button onClick={() => setEditing(blankApi)} className="flex h-11 w-fit items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Plus className="h-4 w-4" /> Thêm API</button>
        {apis.map((api) => (
          <article key={api.id} className="rounded-lg border border-brand-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{api.name}</h2>
                <p className="break-all text-xs text-neutral-500">{api.method} · {api.endpoint}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(api)} className="h-9 rounded-md border border-brand-line px-3 text-sm">Sửa</button>
                <button onClick={() => remove(api.id)} className="grid h-9 w-9 place-items-center rounded-md border border-brand-line text-red-600" title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-neutral-600">{api.description}</p>
          </article>
        ))}
      </div>
      {editing ? <ApiForm editing={editing} setEditing={setEditing} submit={submit} /> : null}
    </div>
  );
}

function ApiForm({ editing, setEditing, submit }: { editing: Partial<ApiConfigDto>; setEditing: (value: Partial<ApiConfigDto> | null) => void; submit: (event: FormEvent) => void }) {
  return (
    <form onSubmit={submit} className="rounded-lg border border-brand-line p-4">
      <h2 className="mb-3 font-semibold">Cấu hình API</h2>
      <TextInput label="Tên API" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
      <TextInput label="Key" value={editing.key ?? ""} onChange={(v) => setEditing({ ...editing, key: v })} />
      <TextInput label="Endpoint" value={editing.endpoint ?? ""} onChange={(v) => setEditing({ ...editing, endpoint: v })} />
      <Select label="Method" value={editing.method ?? "POST"} onChange={(v) => setEditing({ ...editing, method: v as "GET" | "POST" })} options={["GET", "POST"]} />
      <TextArea label="Header JSON" value={editing.headers ?? "{}"} onChange={(v) => setEditing({ ...editing, headers: v })} />
      <TextArea label="Body mẫu" value={editing.bodySample ?? "{}"} onChange={(v) => setEditing({ ...editing, bodySample: v })} />
      <TextArea label="Mô tả" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
      <Toggle checked={Boolean(editing.isActive)} label="Bật API" onChange={(value) => setEditing({ ...editing, isActive: value })} />
      <div className="mt-4 flex gap-2">
        <button className="flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Save className="h-4 w-4" /> Lưu</button>
        <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-md border border-brand-line px-4">Hủy</button>
      </div>
    </form>
  );
}

type TrainingDraft = Partial<KnowledgeEntryDto> & {
  id?: string;
  sourceMessageIds: string[];
};

function TrainingPanel({
  entries,
  messages,
  reload,
  setNotice
}: {
  entries: KnowledgeEntryDto[];
  messages: UnrecognizedMessageDto[];
  reload: () => Promise<void>;
  setNotice: (value: string) => void;
}) {
  const [view, setView] = useState<"questions" | "knowledge">("questions");
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const grouped = new Map<string, UnrecognizedMessageDto[]>();
    for (const message of messages) {
      const key = message.normalized.trim() || message.content.trim().toLocaleLowerCase("vi");
      grouped.set(key, [...(grouped.get(key) ?? []), message]);
    }
    return Array.from(grouped.values()).sort((a, b) => {
      const aPending = a.some((item) => !item.isResolved);
      const bPending = b.some((item) => !item.isResolved);
      if (aPending !== bPending) return aPending ? -1 : 1;
      return new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime();
    });
  }, [messages]);

  const unresolvedCount = messages.filter((item) => !item.isResolved).length;
  const activeKnowledgeCount = entries.filter((item) => item.isActive).length;

  function startFromGroup(group: UnrecognizedMessageDto[]) {
    const representative = group.find((item) => !item.isResolved) ?? group[0];
    const keywords = representative.normalized
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 8)
      .join(", ");
    setDraft({
      ...blankKnowledge,
      question: representative.content,
      keywords,
      sourceLabel: "Huấn luyện Em Ry",
      sourceMessageIds: group.map((item) => item.id)
    });
  }

  function startManual() {
    setDraft({ ...blankKnowledge, sourceLabel: "Huấn luyện Em Ry", sourceMessageIds: [] });
  }

  function editKnowledge(entry: KnowledgeEntryDto) {
    setDraft({ ...entry, sourceMessageIds: [] });
  }

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft?.question?.trim() || !draft.answer?.trim()) {
      setNotice("Vui lòng nhập đủ câu hỏi mẫu và câu trả lời.");
      return;
    }
    setSaving(true);
    try {
      const { sourceMessageIds, ...knowledgePayload } = draft;
      await fetchJson(draft.id ? `/api/admin/knowledge/${draft.id}` : "/api/admin/knowledge", {
        method: draft.id ? "PUT" : "POST",
        body: JSON.stringify(knowledgePayload)
      });
      await Promise.all(
        sourceMessageIds.map((id) =>
          fetchJson("/api/admin/unrecognized", {
            method: "PATCH",
            body: JSON.stringify({ id, isResolved: true })
          })
        )
      );
      setDraft(null);
      await reload();
      setNotice(draft.id ? "Đã cập nhật kiến thức cho Em Ry." : "Đã duyệt câu trả lời và cho Em Ry sử dụng.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu nội dung huấn luyện.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleGroup(group: UnrecognizedMessageDto[]) {
    const shouldResolve = group.some((item) => !item.isResolved);
    try {
      await Promise.all(
        group.map((item) =>
          fetchJson("/api/admin/unrecognized", {
            method: "PATCH",
            body: JSON.stringify({ id: item.id, isResolved: shouldResolve })
          })
        )
      );
      await reload();
      setNotice(shouldResolve ? "Đã đánh dấu nhóm câu hỏi là đã xử lý." : "Đã mở lại nhóm câu hỏi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể cập nhật câu hỏi.");
    }
  }

  async function removeKnowledge(id: string) {
    try {
      await fetchJson(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      if (draft?.id === id) setDraft(null);
      await reload();
      setNotice("Đã xóa kiến thức.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa kiến thức.");
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Huấn luyện Em Ry</h1>
        <p className="mt-1 text-sm text-neutral-600">Duyệt câu Ry chưa hiểu, viết câu trả lời đúng rồi mới đưa vào sử dụng.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><span className="text-xs text-amber-700">Chờ xử lý</span><strong className="mt-1 block text-2xl text-amber-900">{unresolvedCount}</strong></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><span className="text-xs text-emerald-700">Kiến thức đang dùng</span><strong className="mt-1 block text-2xl text-emerald-900">{activeKnowledgeCount}</strong></div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3"><span className="text-xs text-blue-700">Đã xử lý</span><strong className="mt-1 block text-2xl text-blue-900">{messages.length - unresolvedCount}</strong></div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setView("questions")} className={`h-10 rounded-md px-4 text-sm font-semibold ${view === "questions" ? "bg-brand-dark text-white" : "border border-brand-line bg-white"}`}>Câu Ry chưa hiểu</button>
        <button type="button" onClick={() => setView("knowledge")} className={`h-10 rounded-md px-4 text-sm font-semibold ${view === "knowledge" ? "bg-brand-dark text-white" : "border border-brand-line bg-white"}`}>Kho kiến thức</button>
        <button type="button" onClick={startManual} className="ml-auto flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Thêm kiến thức</button>
      </div>

      <div className={`grid gap-4 ${draft ? "lg:grid-cols-[minmax(0,1fr)_400px]" : ""}`}>
        <div className="grid content-start gap-3">
          {view === "questions" ? groups.map((group) => {
            const representative = group.find((item) => !item.isResolved) ?? group[0];
            const isResolved = group.every((item) => item.isResolved);
            return (
              <article key={representative.normalized || representative.id} className={`rounded-xl border p-4 ${isResolved ? "border-neutral-200 bg-neutral-50 opacity-70" : "border-amber-200 bg-white"}`}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words font-semibold">{representative.content}</p>
                      {group.length > 1 ? <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{group.length} lần hỏi</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Chuẩn hóa: {representative.normalized}</p>
                    <p className="mt-1 text-xs text-neutral-400">{new Date(representative.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!isResolved ? <button type="button" onClick={() => startFromGroup(group)} className="rounded-md bg-brand-red px-3 py-2 text-xs font-semibold text-white">Soạn câu trả lời</button> : null}
                    <button type="button" onClick={() => toggleGroup(group)} className="rounded-md border border-brand-line px-3 py-2 text-xs font-semibold">{isResolved ? "Mở lại" : "Bỏ qua"}</button>
                  </div>
                </div>
              </article>
            );
          }) : entries.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-brand-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{entry.question}</h2>
                  <p className="mt-1 text-xs text-neutral-500">{entry.category} · {entry.isActive ? "Đang dùng" : "Tạm tắt"} · {entry.sourceLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editKnowledge(entry)} className="h-9 rounded-md border border-brand-line px-3 text-sm">Sửa</button>
                  <button type="button" onClick={() => removeKnowledge(entry.id)} className="grid h-9 w-9 place-items-center rounded-md border border-brand-line text-red-600" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{entry.answer}</p>
            </article>
          ))}
          {view === "questions" && !groups.length ? <p className="rounded-xl border border-dashed border-brand-line p-5 text-sm text-neutral-500">Chưa có câu hỏi nào Ry không hiểu.</p> : null}
          {view === "knowledge" && !entries.length ? <p className="rounded-xl border border-dashed border-brand-line p-5 text-sm text-neutral-500">Kho kiến thức đang trống.</p> : null}
        </div>

        {draft ? (
          <form onSubmit={saveDraft} className="h-fit rounded-xl border border-brand-line bg-white p-4 lg:sticky lg:top-24">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div><h2 className="font-semibold">{draft.id ? "Sửa kiến thức" : "Duyệt câu trả lời"}</h2><p className="text-xs text-neutral-500">Chỉ câu đã lưu mới được bot sử dụng.</p></div>
              <button type="button" onClick={() => setDraft(null)} className="grid h-8 w-8 place-items-center rounded-md border border-brand-line" aria-label="Đóng"><X className="h-4 w-4" /></button>
            </div>
            <TextArea label="Câu hỏi mẫu" value={draft.question ?? ""} onChange={(value) => setDraft({ ...draft, question: value })} />
            <TextArea label="Câu trả lời đã kiểm tra" value={draft.answer ?? ""} onChange={(value) => setDraft({ ...draft, answer: value })} />
            <TextInput label="Từ khóa (cách nhau bằng dấu phẩy)" value={draft.keywords ?? ""} onChange={(value) => setDraft({ ...draft, keywords: value })} />
            <TextInput label="Danh mục" value={draft.category ?? "Chung"} onChange={(value) => setDraft({ ...draft, category: value })} />
            <TextInput label="Tên nguồn" value={draft.sourceLabel ?? ""} onChange={(value) => setDraft({ ...draft, sourceLabel: value })} />
            <TextInput label="URL nguồn (không bắt buộc)" value={draft.sourceUrl ?? ""} onChange={(value) => setDraft({ ...draft, sourceUrl: value })} />
            <Toggle checked={Boolean(draft.isActive)} label="Cho phép bot sử dụng" onChange={(value) => setDraft({ ...draft, isActive: value })} />
            {draft.sourceMessageIds.length ? <p className="mt-3 rounded-md bg-blue-50 p-2 text-xs text-blue-800">Khi duyệt, {draft.sourceMessageIds.length} câu hỏi cùng nhóm sẽ được đánh dấu đã xử lý.</p> : null}
            <button disabled={saving} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white disabled:opacity-60">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {draft.id ? "Lưu thay đổi" : "Duyệt và cho bot sử dụng"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function KnowledgePanel({ entries, reload, setNotice }: { entries: KnowledgeEntryDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  const [editing, setEditing] = useState<(Partial<KnowledgeEntryDto> & { id?: string }) | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      await fetchJson(editing.id ? `/api/admin/knowledge/${editing.id}` : "/api/admin/knowledge", {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(editing)
      });
      setEditing(null);
      await reload();
      setNotice("Đã lưu nội dung kiến thức.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu nội dung kiến thức.");
    }
  }

  async function remove(id: string) {
    await fetchJson(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    await reload();
    setNotice("Đã xóa nội dung kiến thức.");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-3">
        <button onClick={() => setEditing(blankKnowledge)} className="flex h-11 w-fit items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white">
          <Plus className="h-4 w-4" /> Thêm kiến thức
        </button>
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-lg border border-brand-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{entry.question}</h2>
                <p className="text-xs text-neutral-500">{entry.category} · {entry.isActive ? "Đang dùng" : "Tạm tắt"} · Nguồn: {entry.sourceLabel}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(entry)} className="h-9 rounded-md border border-brand-line px-3 text-sm">Sửa</button>
                <button onClick={() => remove(entry.id)} className="grid h-9 w-9 place-items-center rounded-md border border-brand-line text-red-600" title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{entry.answer}</p>
          </article>
        ))}
        {!entries.length ? <p className="rounded-lg border border-dashed border-brand-line p-4 text-sm text-neutral-500">Chưa có nội dung. Bot sẽ chuyển người dùng sang hỗ trợ khi không tìm thấy câu trả lời đáng tin cậy.</p> : null}
      </div>
      {editing ? (
        <form onSubmit={submit} className="rounded-lg border border-brand-line p-4">
          <h2 className="mb-3 font-semibold">Nội dung kiến thức</h2>
          <TextArea label="Câu hỏi mẫu" value={editing.question ?? ""} onChange={(v) => setEditing({ ...editing, question: v })} />
          <TextArea label="Câu trả lời" value={editing.answer ?? ""} onChange={(v) => setEditing({ ...editing, answer: v })} />
          <TextInput label="Từ khóa (cách nhau bằng dấu phẩy)" value={editing.keywords ?? ""} onChange={(v) => setEditing({ ...editing, keywords: v })} />
          <TextInput label="Danh mục" value={editing.category ?? "Chung"} onChange={(v) => setEditing({ ...editing, category: v })} />
          <TextInput label="Tên nguồn" value={editing.sourceLabel ?? ""} onChange={(v) => setEditing({ ...editing, sourceLabel: v })} />
          <TextInput label="URL nguồn (không bắt buộc)" value={editing.sourceUrl ?? ""} onChange={(v) => setEditing({ ...editing, sourceUrl: v })} />
          <Toggle checked={Boolean(editing.isActive)} label="Cho phép bot sử dụng" onChange={(value) => setEditing({ ...editing, isActive: value })} />
          <div className="mt-4 flex gap-2">
            <button className="flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Save className="h-4 w-4" /> Lưu</button>
            <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-md border border-brand-line px-4">Hủy</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function FeedbackPanel({ items }: { items: FeedbackDto[] }) {
  const helpful = items.filter((item) => item.rating === "helpful").length;
  const notHelpful = items.filter((item) => item.rating === "not_helpful").length;
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><span className="text-xs text-emerald-700">Hữu ích</span><strong className="mt-1 block text-2xl text-emerald-800">{helpful}</strong></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><span className="text-xs text-amber-700">Chưa đúng</span><strong className="mt-1 block text-2xl text-amber-800">{notHelpful}</strong></div>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-brand-line bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.rating === "helpful" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.rating === "helpful" ? "Hữu ích" : "Chưa đúng"}</span>
              <time className="text-[10px] text-neutral-400">{new Date(item.createdAt).toLocaleString("vi-VN")}</time>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-5 text-neutral-600">{item.preview || "Không có nội dung xem trước."}</p>
          </article>
        ))}
        {!items.length ? <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">Chưa có đánh giá từ người dùng.</p> : null}
      </div>
    </div>
  );
}

function UnrecognizedPanel({ messages, reload, setNotice }: { messages: UnrecognizedMessageDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  async function toggle(item: UnrecognizedMessageDto) {
    try {
      await fetchJson("/api/admin/unrecognized", {
        method: "PATCH",
        body: JSON.stringify({ id: item.id, isResolved: !item.isResolved })
      });
      await reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể cập nhật.");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Đây là những câu Ry chưa hiểu và đã được che email, số điện thoại. Bạn có thể dùng chúng để bổ sung intent hoặc kho kiến thức.
      </div>
      {messages.map((item) => (
        <article key={item.id} className={`rounded-lg border p-4 ${item.isResolved ? "border-neutral-200 bg-neutral-50 opacity-70" : "border-amber-200 bg-white"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-medium">{item.content}</p>
              <p className="mt-1 text-xs text-neutral-500">Chuẩn hóa: {item.normalized}</p>
              <p className="mt-1 text-xs text-neutral-400">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <button onClick={() => toggle(item)} className="shrink-0 rounded-md border border-brand-line px-3 py-2 text-xs font-semibold">
              {item.isResolved ? "Mở lại" : "Đã xử lý"}
            </button>
          </div>
        </article>
      ))}
      {!messages.length ? <p className="rounded-lg border border-dashed border-brand-line p-4 text-sm text-neutral-500">Chưa có câu nào Ry không hiểu.</p> : null}
    </div>
  );
}

function NoticesPanel({ notices, reload, setNotice }: { notices: AppNoticeDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  const [editing, setEditing] = useState<(Partial<AppNoticeDto> & { id?: string }) | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/admin/notices/${editing.id}` : "/api/admin/notices";
      await fetchJson(url, { method, body: JSON.stringify(editing) });
      setEditing(null);
      await reload();
      setNotice("Đã lưu thông báo.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu thông báo.");
    }
  }

  async function remove(id: string) {
    try {
      await fetchJson(`/api/admin/notices/${id}`, { method: "DELETE" });
      await reload();
      setNotice("Đã xóa thông báo.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa thông báo.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-3">
        <button onClick={() => setEditing(blankNotice)} className="flex h-11 w-fit items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Plus className="h-4 w-4" /> Thêm thông báo</button>
        {notices.map((item) => (
          <article key={item.id} className="rounded-lg border border-brand-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-xs text-neutral-500">{item.displaySeconds}s · {item.isActive ? "Bật" : "Tắt"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(item)} className="h-9 rounded-md border border-brand-line px-3 text-sm">Sửa</button>
                <button onClick={() => remove(item.id)} className="grid h-9 w-9 place-items-center rounded-md border border-brand-line text-red-600" title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{item.message}</p>
          </article>
        ))}
        {!notices.length ? <p className="rounded-lg border border-dashed border-brand-line p-4 text-sm text-neutral-500">Chưa có thông báo nào.</p> : null}
      </div>
      {editing ? <NoticeForm editing={editing} setEditing={setEditing} submit={submit} /> : null}
    </div>
  );
}

function NoticeForm({ editing, setEditing, submit }: { editing: Partial<AppNoticeDto>; setEditing: (value: Partial<AppNoticeDto> | null) => void; submit: (event: FormEvent) => void }) {
  return (
    <form onSubmit={submit} className="rounded-lg border border-brand-line p-4">
      <h2 className="mb-3 font-semibold">Thông báo app</h2>
      <TextInput label="Tiêu đề" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
      <TextArea label="Nội dung" value={editing.message ?? ""} onChange={(v) => setEditing({ ...editing, message: v })} />
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium">Số giây hiển thị</span>
        <input
          type="number"
          min={1}
          max={3600}
          value={editing.displaySeconds ?? 10}
          onChange={(event) => setEditing({ ...editing, displaySeconds: Number(event.target.value) })}
          className="h-10 w-full rounded-md border border-brand-line px-3 outline-none focus:border-brand-red"
        />
      </label>
      <Toggle checked={Boolean(editing.isActive)} label="Bật thông báo" onChange={(value) => setEditing({ ...editing, isActive: value })} />
      <div className="mt-4 flex gap-2">
        <button className="flex h-10 items-center gap-2 rounded-md bg-brand-red px-4 font-semibold text-white"><Save className="h-4 w-4" /> Lưu</button>
        <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-md border border-brand-line px-4">Hủy</button>
      </div>
    </form>
  );
}

function ChatsPanel({ chats, reload, setNotice }: { chats: ChatDto[]; reload: () => Promise<void>; setNotice: (value: string) => void }) {
  async function remove(id: string) {
    try {
      await fetchJson(`/api/admin/chats/${id}`, { method: "DELETE" });
      await reload();
      setNotice("Đã xóa phiên chat.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa phiên chat.");
    }
  }

  return (
    <div className="grid gap-3">
      {chats.map((chat) => (
        <article key={chat.id} className="rounded-lg border border-brand-line p-4">
          <div className="mb-3 flex justify-end">
            <button onClick={() => remove(chat.id)} className="grid h-9 w-9 place-items-center rounded-md border border-brand-line text-red-600" title="Xóa chat">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <h2 className="font-semibold">{chat.user?.email || chat.user?.phone || "Khách chưa đăng nhập"}</h2>
          <p className="mb-3 text-xs text-neutral-500">{new Date(chat.updatedAt).toLocaleString("vi-VN")}</p>
          <div className="grid gap-2">
            {chat.messages.map((message) => (
              <p key={message.id} className="rounded-md bg-brand-soft p-2 text-sm">
                <span className="font-semibold">{message.sender}: </span>{message.content}
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function SiteSettingsPanel({ settings, setSettings, setNotice }: { settings: SiteSettingsDto; setSettings: (value: SiteSettingsDto) => void; setNotice: (value: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState("");
  const [referralStats, setReferralStats] = useState<Record<string, { visits: number; registrations: number; lastVisitAt?: string | null; lastRegistrationAt?: string | null }>>({});

  useEffect(() => {
    void fetchJson("/api/admin/referral-domains").then((data) => {
      const next: typeof referralStats = {};
      for (const item of data.domains ?? []) next[String(item.domain).replace(/^www\./, "")] = item;
      setReferralStats(next);
    }).catch(() => null);
  }, []);

  function addReferralDomain() {
    setSettings({ ...settings, referralDomains: [...settings.referralDomains, { domain: "", referralCode: "", enabled: true }] });
  }

  function updateReferralDomain(index: number, patch: Partial<SiteSettingsDto["referralDomains"][number]>) {
    setSettings({ ...settings, referralDomains: settings.referralDomains.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  async function copyDomainInstallCommand(domain: string) {
    const normalized = domain.trim().toLowerCase().replace(/^www\./, "");
    const command = `DOMAIN='${normalized}'
sudo tee "/etc/nginx/sites-available/$DOMAIN" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \\$host;
        proxy_set_header X-Forwarded-Host \\$host;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
sudo ln -sfn "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d "$DOMAIN" --redirect
sudo nginx -t && sudo systemctl reload nginx`;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedDomain(normalized);
      window.setTimeout(() => setCopiedDomain((current) => current === normalized ? "" : current), 2500);
    } catch {
      setNotice("Không thể sao chép tự động. Hãy mở Admin bằng HTTPS rồi thử lại.");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await fetchJson("/api/admin/site-settings", { method: "PUT", body: JSON.stringify(settings) });
      setSettings(data.settings);
      setNotice("Đã lưu cài đặt thương hiệu và SEO.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: "logo" | "avatar" | "seo", file: File) {
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const response = await fetch("/api/admin/site-settings/upload", { method: "POST", body: form });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error ?? "Không thể tải ảnh.");
      if (kind === "logo") setSettings({ ...settings, logoUrl: data.url });
      if (kind === "avatar") setSettings({ ...settings, avatarUrl: data.url });
      if (kind === "seo") setSettings({ ...settings, ogImageUrl: data.url, twitterImageUrl: data.url });
      setNotice("Đã tải ảnh. Bấm Lưu cài đặt để áp dụng.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể tải ảnh.");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      <section className="rounded-xl border border-brand-line bg-white p-4">
        <div className="mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-brand-red" /><div><h2 className="font-semibold">Logo & avatar Em Ry</h2><p className="text-xs text-neutral-500">PNG, JPG hoặc WEBP, tối đa 5MB.</p></div></div>
        <TextInput label="Tên website / ứng dụng" value={settings.siteName} onChange={(value) => setSettings({ ...settings, siteName: value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageSetting label="Logo website" value={settings.logoUrl} onChange={(value) => setSettings({ ...settings, logoUrl: value })} onUpload={(file) => upload("logo", file)} />
          <ImageSetting label="Avatar Em Ry" value={settings.avatarUrl} onChange={(value) => setSettings({ ...settings, avatarUrl: value })} onUpload={(file) => upload("avatar", file)} round />
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold">Domain giới thiệu cố định</h2><p className="mt-1 text-xs leading-5 text-neutral-500">Khách vào domain này sẽ được server tự gắn đúng mã giới thiệu khi đăng ký.</p></div>
          <button type="button" onClick={addReferralDomain} className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand-line px-3 text-xs font-semibold"><Plus className="h-4 w-4" />Thêm domain</button>
        </div>
        <div className="mt-4 grid gap-3">
          {settings.referralDomains.map((item, index) => {
            const stats = referralStats[item.domain.replace(/^www\./, "")];
            return (
              <div key={index} className="rounded-xl border border-brand-line bg-neutral-50 p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_auto_auto] md:items-end">
                  <TextInput label="Domain" value={item.domain} onChange={(domain) => updateReferralDomain(index, { domain: domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") })} />
                  <TextInput label="Mã giới thiệu cố định" value={item.referralCode} onChange={(referralCode) => updateReferralDomain(index, { referralCode: referralCode.trim() })} />
                  <Toggle checked={item.enabled} label="Đang bật" onChange={(enabled) => updateReferralDomain(index, { enabled })} />
                  <button type="button" onClick={() => setSettings({ ...settings, referralDomains: settings.referralDomains.filter((_, itemIndex) => itemIndex !== index) })} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-white text-red-600" aria-label="Xóa domain"><Trash2 className="h-4 w-4" /></button>
                </div>
                {item.domain ? <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-600"><span>Truy cập: <strong>{stats?.visits ?? 0}</strong></span><span>Đăng ký: <strong>{stats?.registrations ?? 0}</strong></span>{stats?.lastRegistrationAt ? <span>Đăng ký gần nhất: <strong>{relativeTime(stats.lastRegistrationAt)}</strong></span> : null}</div> : null}
                {item.domain ? (
                  <details className="mt-3 rounded-lg border border-brand-line bg-white p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-neutral-800">Hướng dẫn kết nối domain và cài SSL</summary>
                    <div className="mt-3 grid gap-3 text-sm leading-6 text-neutral-700">
                      <div className="rounded-lg bg-brand-soft p-3">
                        <strong>1. Trỏ domain về server</strong>
                        <p>Trong trang quản lý domain, tạo bản ghi <code>A</code>: Tên <code>@</code> → IP máy chủ đang chạy website. Chờ DNS cập nhật rồi mới làm bước 2.</p>
                      </div>
                      <div className="rounded-lg bg-brand-soft p-3">
                        <strong>2. Cài Nginx và SSL miễn phí</strong>
                        <p>SSH vào server, bấm sao chép rồi dán toàn bộ lệnh bên dưới. Lệnh sẽ kiểm tra Nginx trước khi áp dụng và dùng Certbot để cấp HTTPS.</p>
                        <button type="button" onClick={() => void copyDomainInstallCommand(item.domain)} className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white">
                          {copiedDomain === item.domain.replace(/^www\./, "") ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                          {copiedDomain === item.domain.replace(/^www\./, "") ? "Đã sao chép lệnh" : "Sao chép lệnh cài đặt"}
                        </button>
                      </div>
                      <div className="rounded-lg bg-brand-soft p-3">
                        <strong>3. Kiểm tra và lưu</strong>
                        <p>Mở <code>https://{item.domain}</code>. Nếu website hiện bình thường, nhập mã giới thiệu, bật domain và bấm <strong>Lưu cài đặt</strong>.</p>
                      </div>
                      <p className="text-xs text-amber-700">Lưu ý: server cần cài sẵn Nginx và Certbot. Không chạy lệnh khi domain chưa trỏ đúng IP server.</p>
                    </div>
                  </details>
                ) : null}
              </div>
            );
          })}
          {!settings.referralDomains.length ? <p className="rounded-lg border border-dashed p-4 text-center text-sm text-neutral-500">Chưa cấu hình domain giới thiệu.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-4">
        <div className="mb-4 flex items-center gap-2"><Search className="h-5 w-5 text-brand-red" /><div><h2 className="font-semibold">SEO cơ bản</h2><p className="text-xs text-neutral-500">Tiêu đề, mô tả, từ khóa và URL chuẩn của trang.</p></div></div>
        <TextInput label={`SEO title (${settings.seoTitle.length}/120)`} value={settings.seoTitle} onChange={(value) => setSettings({ ...settings, seoTitle: value })} />
        <TextArea label={`Meta description (${settings.seoDescription.length}/320)`} value={settings.seoDescription} onChange={(value) => setSettings({ ...settings, seoDescription: value })} />
        <TextArea label="Từ khóa, phân cách bằng dấu phẩy" value={settings.seoKeywords} onChange={(value) => setSettings({ ...settings, seoKeywords: value })} />
        <TextInput label="Canonical URL" value={settings.canonicalUrl} onChange={(value) => setSettings({ ...settings, canonicalUrl: value })} />
        <div className="flex flex-wrap gap-5 rounded-lg bg-brand-soft p-3">
          <Toggle checked={settings.robotsIndex} label="Cho phép lập chỉ mục" onChange={(value) => setSettings({ ...settings, robotsIndex: value })} />
          <Toggle checked={settings.robotsFollow} label="Cho phép theo liên kết" onChange={(value) => setSettings({ ...settings, robotsFollow: value })} />
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-4">
        <h2 className="mb-4 font-semibold">Open Graph & mạng xã hội</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-600">Facebook / Zalo</h3>
            <TextInput label="OG title" value={settings.ogTitle} onChange={(value) => setSettings({ ...settings, ogTitle: value })} />
            <TextArea label="OG description" value={settings.ogDescription} onChange={(value) => setSettings({ ...settings, ogDescription: value })} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-600">Twitter / X</h3>
            <TextInput label="Twitter title" value={settings.twitterTitle} onChange={(value) => setSettings({ ...settings, twitterTitle: value })} />
            <TextArea label="Twitter description" value={settings.twitterDescription} onChange={(value) => setSettings({ ...settings, twitterDescription: value })} />
          </div>
        </div>
        <ImageSetting label="Ảnh chia sẻ mạng xã hội" value={settings.ogImageUrl} onChange={(value) => setSettings({ ...settings, ogImageUrl: value, twitterImageUrl: value })} onUpload={(file) => upload("seo", file)} />
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-4">
        <h2 className="mb-4 font-semibold">Thông tin tổ chức</h2>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextInput label="Tên tổ chức" value={settings.organizationName} onChange={(value) => setSettings({ ...settings, organizationName: value })} />
          <TextInput label="Email" value={settings.organizationEmail} onChange={(value) => setSettings({ ...settings, organizationEmail: value })} />
          <TextInput label="Số điện thoại" value={settings.organizationPhone} onChange={(value) => setSettings({ ...settings, organizationPhone: value })} />
          <TextInput label="Ảnh Twitter (có thể dùng chung ảnh OG)" value={settings.twitterImageUrl} onChange={(value) => setSettings({ ...settings, twitterImageUrl: value })} />
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-4">
        <div className="mb-4">
          <h2 className="font-semibold">Analytics & xác minh tìm kiếm</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Chỉ nhập ID, không dán mã JavaScript. Để tránh ghi nhận trùng, nên dùng GA4 trực tiếp hoặc cấu hình GA4 bên trong Google Tag Manager.</p>
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextInput label="Google Analytics 4 (G-XXXXXXXXXX)" value={settings.googleAnalyticsId} onChange={(value) => setSettings({ ...settings, googleAnalyticsId: value.trim() })} />
          <TextInput label="Google Tag Manager (GTM-XXXXXXX)" value={settings.googleTagManagerId} onChange={(value) => setSettings({ ...settings, googleTagManagerId: value.trim() })} />
          <TextInput label="Meta Pixel ID" value={settings.metaPixelId} onChange={(value) => setSettings({ ...settings, metaPixelId: value.trim() })} />
          <TextInput label="Google Search Console verification" value={settings.googleSiteVerification} onChange={(value) => setSettings({ ...settings, googleSiteVerification: value.trim() })} />
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white p-4">
        <div className="mb-4">
          <h2 className="font-semibold">Riêng tư & hiệu năng chat</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Tác vụ <code>npm run db:cleanup</code> áp dụng các thời hạn này. Ticket chỉ bị xóa khi đã RESOLVED hoặc CLOSED.</p>
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput label="Lưu tin nhắn khách (ngày)" value={settings.guestChatRetentionDays} min={1} max={365} onChange={(value) => setSettings({ ...settings, guestChatRetentionDays: value })} />
          <NumberInput label="Lưu tin nhắn thành viên (ngày)" value={settings.memberChatRetentionDays} min={1} max={730} onChange={(value) => setSettings({ ...settings, memberChatRetentionDays: value })} />
          <NumberInput label="Xóa phiên không hoạt động (ngày)" value={settings.inactiveSessionRetentionDays} min={7} max={730} onChange={(value) => setSettings({ ...settings, inactiveSessionRetentionDays: value })} />
          <NumberInput label="Lưu ticket đã đóng (ngày)" value={settings.supportTicketRetentionDays} min={30} max={1825} onChange={(value) => setSettings({ ...settings, supportTicketRetentionDays: value })} />
          <NumberInput label="Cache link hoàn tiền (giây)" value={settings.cashbackCacheSeconds} min={0} max={3600} onChange={(value) => setSettings({ ...settings, cashbackCacheSeconds: value })} />
        </div>
        <Toggle checked={settings.autoSubmitShoppingLinks} label="Tự gửi khi người dùng dán link Shopee/TikTok hợp lệ" onChange={(value) => setSettings({ ...settings, autoSubmitShoppingLinks: value })} />
      </section>

      <button disabled={saving} className="sticky bottom-3 flex h-11 w-fit items-center gap-2 rounded-lg bg-brand-red px-5 font-semibold text-white shadow-lg disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Đang lưu..." : "Lưu cài đặt"}</button>
    </form>
  );
}

function ImageSetting({ label, value, onChange, onUpload, round = false }: { label: string; value: string; onChange: (value: string) => void; onUpload: (file: File) => Promise<void>; round?: boolean }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="mb-3 rounded-lg border border-brand-line p-3">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <img src={value || "/logo.png"} alt="" className={`h-16 w-16 shrink-0 border border-brand-line bg-white object-cover ${round ? "rounded-full" : "rounded-lg"}`} />
        <div className="min-w-0 flex-1">
          <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/logo.png hoặc https://..." className="h-9 w-full rounded-md border border-brand-line px-2 text-xs outline-none focus:border-brand-red" />
          <label className="mt-2 inline-flex h-8 cursor-pointer items-center rounded-md border border-brand-line px-3 text-xs font-medium hover:bg-brand-soft">
            {uploading ? "Đang tải..." : "Chọn ảnh"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try { await onUpload(file); } finally { setUploading(false); event.target.value = ""; }
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-brand-line px-3 outline-none focus:border-brand-red" />
    </label>
  );
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} className="h-10 w-full rounded-md border border-brand-line px-3 outline-none focus:border-brand-red" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-20 w-full rounded-md border border-brand-line p-3 outline-none focus:border-brand-red" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-brand-line px-3">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brand-red" />
      {label}
    </label>
  );
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) }
  });
  const data = await readJson(response);
  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error(data.error ?? "Vui long dang nhap admin.");
  }
  if (!response.ok) throw new Error(data.error ?? "Yêu cầu thất bại.");
  return data;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}
