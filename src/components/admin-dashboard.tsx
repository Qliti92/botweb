"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, Bot, History, LogOut, Plus, Save, Server, Trash2 } from "lucide-react";
import type { ApiConfigDto, AppNoticeDto, FlowDto } from "@/types/app";

type ChatDto = {
  id: string;
  user?: { phone: string; email: string; userId: string } | null;
  messages: { id: string; sender: string; content: string; createdAt: string }[];
  updatedAt: string;
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

export function AdminDashboard() {
  const [tab, setTab] = useState<"flows" | "apis" | "notices" | "chats">("flows");
  const [flows, setFlows] = useState<FlowDto[]>([]);
  const [apis, setApis] = useState<ApiConfigDto[]>([]);
  const [notices, setNotices] = useState<AppNoticeDto[]>([]);
  const [chats, setChats] = useState<ChatDto[]>([]);
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
    const [flowsData, apisData, noticesData, chatsData] = await Promise.all([
      apiFetch("/api/admin/flows"),
      apiFetch("/api/admin/apis"),
      apiFetch("/api/admin/notices"),
      apiFetch("/api/admin/chats")
    ]);
    setFlows(flowsData.flows);
    setApis(apisData.apis);
    setNotices(noticesData.notices);
    setChats(chatsData.sessions);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const tabs = useMemo(
    () =>
      [
        { id: "flows", label: "Kịch bản", icon: Bot },
        { id: "apis", label: "API", icon: Server },
        { id: "notices", label: "Thông báo", icon: Bell },
        { id: "chats", label: "Lịch sử", icon: History }
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
        <nav className="mx-auto grid max-w-6xl grid-cols-4 gap-1 px-2 pb-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex h-11 items-center justify-center gap-1 rounded-md text-xs font-medium ${tab === item.id ? "bg-brand-red text-white" : "bg-white/8 text-white/80"}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-5">
        {notice ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{notice}</p> : null}
        {tab === "flows" ? <FlowsPanel flows={flows} apis={apis} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "apis" ? <ApisPanel apis={apis} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "notices" ? <NoticesPanel notices={notices} reload={loadAll} setNotice={setNotice} /> : null}
        {tab === "chats" ? <ChatsPanel chats={chats} reload={loadAll} setNotice={setNotice} /> : null}
      </section>
    </main>
  );
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
