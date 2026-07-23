"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, BookOpen, Bot, History, Image as ImageIcon, LogOut, Plus, Save, Search, Server, Settings, Trash2 } from "lucide-react";
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
type SiteSettingsDto = {
  siteName: string; logoUrl: string; avatarUrl: string; seoTitle: string; seoDescription: string; seoKeywords: string;
  canonicalUrl: string; ogTitle: string; ogDescription: string; ogImageUrl: string; twitterTitle: string;
  twitterDescription: string; twitterImageUrl: string; robotsIndex: boolean; robotsFollow: boolean;
  organizationName: string; organizationEmail: string; organizationPhone: string;
};

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
  const [tab, setTab] = useState<"overview" | "tickets" | "intents" | "flows" | "apis" | "knowledge" | "unrecognized" | "notices" | "chats" | "settings">("overview");
  const [flows, setFlows] = useState<FlowDto[]>([]);
  const [apis, setApis] = useState<ApiConfigDto[]>([]);
  const [notices, setNotices] = useState<AppNoticeDto[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntryDto[]>([]);
  const [unrecognized, setUnrecognized] = useState<UnrecognizedMessageDto[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [intents, setIntents] = useState<IntentDto[]>([]);
  const [chats, setChats] = useState<ChatDto[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsDto | null>(null);
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
    const [dashboardData, ticketsData, intentsData, flowsData, apisData, knowledgeData, unrecognizedData, noticesData, chatsData, settingsData] = await Promise.all([
      apiFetch("/api/admin/dashboard"),
      apiFetch("/api/admin/tickets"),
      apiFetch("/api/admin/intents"),
      apiFetch("/api/admin/flows"),
      apiFetch("/api/admin/apis"),
      apiFetch("/api/admin/knowledge"),
      apiFetch("/api/admin/unrecognized"),
      apiFetch("/api/admin/notices"),
      apiFetch("/api/admin/chats"),
      apiFetch("/api/admin/site-settings")
    ]);
    setMetrics(dashboardData.metrics);
    setTickets(ticketsData.tickets);
    setIntents(intentsData.intents);
    setFlows(flowsData.flows);
    setApis(apisData.apis);
    setKnowledge(knowledgeData.entries);
    setUnrecognized(unrecognizedData.messages);
    setNotices(noticesData.notices);
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
        { id: "overview", label: "Tổng quan", icon: History },
        { id: "tickets", label: "Hỗ trợ", icon: AlertCircle },
        { id: "intents", label: "Intent", icon: Bot },
        { id: "flows", label: "Kịch bản", icon: Bot },
        { id: "apis", label: "API", icon: Server },
        { id: "knowledge", label: "Kiến thức", icon: BookOpen },
        { id: "unrecognized", label: "Chưa hiểu", icon: AlertCircle },
        { id: "notices", label: "Thông báo", icon: Bell },
        { id: "chats", label: "Lịch sử", icon: History }
        ,{ id: "settings", label: "Thương hiệu & SEO", icon: Settings }
      ] as const,
    []
  );

  return (
    <main className="min-h-dvh bg-white text-brand-ink">
      <header className="sticky top-0 z-10 border-b border-brand-line bg-brand-dark text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold">AI Chatbot Admin</h1>
            <p className="text-xs text-white/65">Quản lý kịch bản, API và lịch sử chat</p>
          </div>
          <button onClick={logout} className="grid h-10 w-10 place-items-center rounded-md border border-white/20" title="Đăng xuất">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex h-11 shrink-0 items-center justify-center gap-1 rounded-md px-3 text-xs font-medium ${tab === item.id ? "bg-brand-red text-white" : "bg-white/8 text-white/80"}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-5">
        {notice ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{notice}</p> : null}
        {tab === "overview" ? <OverviewPanel metrics={metrics} /> : null}
        {tab === "tickets" ? <TicketsPanel tickets={tickets} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "intents" ? <IntentsPanel intents={intents} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "flows" ? <FlowsPanel flows={flows} apis={apis} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "apis" ? <ApisPanel apis={apis} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "knowledge" ? <KnowledgePanel entries={knowledge} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "unrecognized" ? <UnrecognizedPanel messages={unrecognized} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "notices" ? <NoticesPanel notices={notices} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "chats" ? <ChatsPanel chats={chats} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "settings" && siteSettings ? <SiteSettingsPanel settings={siteSettings} setSettings={setSiteSettings} setNotice={setNotice} /> : null}
      </section>
    </main>
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
        <div className="mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-brand-red" /><div><h2 className="font-semibold">Logo & avatar Em Ry</h2><p className="text-xs text-neutral-500">PNG, JPG hoặc WEBP, tối đa 2MB.</p></div></div>
        <TextInput label="Tên website / ứng dụng" value={settings.siteName} onChange={(value) => setSettings({ ...settings, siteName: value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageSetting label="Logo website" value={settings.logoUrl} onChange={(value) => setSettings({ ...settings, logoUrl: value })} onUpload={(file) => upload("logo", file)} />
          <ImageSetting label="Avatar Em Ry" value={settings.avatarUrl} onChange={(value) => setSettings({ ...settings, avatarUrl: value })} onUpload={(file) => upload("avatar", file)} round />
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
