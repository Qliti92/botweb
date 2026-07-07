"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Headphones,
  History,
  Info,
  Landmark,
  LinkIcon,
  ListChecks,
  LogOut,
  LogIn,
  Menu,
  MessageCircle,
  PackageCheck,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  WalletCards,
  X
} from "lucide-react";
import type { ChatHistoryItem, ChatMessage, ChatSessionPayload } from "@/types/app";

type CashbackCardData = {
  productName?: string;
  affiliateUrl: string;
  cashbackAmount?: string;
  transId?: string;
};

type LoginErrorData = {
  title?: string;
  message?: string;
};

const quickCommands = [
  { label: "Hướng dẫn", command: "/huongdan", icon: BookOpen },
  { label: "Tài khoản", command: "/taikhoan", icon: UserRound },
  { label: "Đơn hàng", command: "/donhang", icon: PackageCheck },
  { label: "Thông báo", command: "/thongbao", icon: Bell },
  { label: "Rút tiền", command: "/ruttien", icon: WalletCards },
  { label: "Lịch sử rút", command: "/lichsurut", icon: WalletCards },
  { label: "Hủy thao tác", command: "/huy", icon: X },
  { label: "Xóa chat", command: "/xoachat", icon: Trash2 }
];

function parseCashbackCard(content: string) {
  if (!content.startsWith("CASHBACK_RESULT:")) return null;

  try {
    return JSON.parse(content.slice("CASHBACK_RESULT:".length)) as CashbackCardData;
  } catch {
    return null;
  }
}

function parseLoginErrorCard(content: string) {
  if (!content.startsWith("LOGIN_ERROR:")) return null;

  try {
    return JSON.parse(content.slice("LOGIN_ERROR:".length)) as LoginErrorData;
  } catch {
    return null;
  }
}

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase();
  if (["approved", "success", "completed", "paid", "done", "đã duyệt", "thành công", "hoàn tất"].some((item) => status.includes(item))) {
    return { label: "Đã duyệt", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 };
  }
  if (["pending", "processing", "waiting", "chờ", "đang"].some((item) => status.includes(item))) {
    return { label: "Đang xử lý", className: "bg-amber-50 text-amber-700 ring-amber-200", icon: Clock3 };
  }
  if (["rejected", "cancelled", "failed", "deny", "hủy", "từ chối", "thất bại"].some((item) => status.includes(item))) {
    return { label: "Từ chối", className: "bg-red-50 text-red-700 ring-red-200", icon: AlertCircle };
  }
  return { label: value.trim() || "Đang cập nhật", className: "bg-neutral-100 text-neutral-700 ring-neutral-200", icon: Info };
}

function getCardTheme(title: string) {
  const text = title.toLowerCase();
  if (text.includes("rút tiền") || text.includes("ví") || text.includes("tài khoản")) return { icon: WalletCards, tone: "bg-red-50 text-brand-red" };
  if (text.includes("đơn hàng")) return { icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" };
  if (text.includes("thông báo")) return { icon: Bell, tone: "bg-amber-50 text-amber-700" };
  if (text.includes("hướng dẫn")) return { icon: ListChecks, tone: "bg-red-50 text-brand-red" };
  if (text.includes("hỗ trợ")) return { icon: Headphones, tone: "bg-red-50 text-brand-red" };
  return { icon: MessageCircle, tone: "bg-red-50 text-brand-red" };
}

function isSupportTitle(title: string) {
  return title.toLowerCase().includes("hỗ trợ");
}

function isOrderTitle(title: string) {
  return title.toLowerCase().includes("đơn hàng");
}

function isAuthStartMessage(content: string) {
  const normalized = content.toLowerCase();
  return normalized.includes("có tài khoản chọn 1") && normalized.includes("chưa có tài khoản chọn 2");
}

export function ChatApp() {
  const [session, setSession] = useState<ChatSessionPayload | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const previousUnreadRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem("chat_session_id");
    if (existing) {
      restoreSession(existing);
      return;
    }
    createSession();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, optimisticMessages.length, sending]);

  useEffect(() => {
    if (session?.user) {
      loadHistory(session.id);
      pollNotifications(session.id);
      const timer = window.setInterval(() => pollNotifications(session.id), 60000);
      return () => window.clearInterval(timer);
    }

    setHistory([]);
    setShowHistory(false);
    setUnreadCount(0);
    setShowNotificationBanner(false);
    previousUnreadRef.current = 0;
  }, [session?.id, session?.user]);

  const accountLabel = useMemo(() => {
    if (!session?.user) return "";
    return session.user.email || session.user.userId;
  }, [session]);

  const status = useMemo(() => {
    if (!session?.user) return "Chưa đăng nhập";
    return `Đang dùng: ${accountLabel}`;
  }, [accountLabel, session]);

  async function restoreSession(sessionId: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/chat/session?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSession(data);
      window.localStorage.setItem("chat_session_id", data.id);
    } catch {
      window.localStorage.removeItem("chat_session_id");
      await createSession();
    } finally {
      setLoading(false);
    }
  }

  async function createSession() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/chat/session", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSession(data);
      window.localStorage.setItem("chat_session_id", data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể khởi tạo chat.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(sessionId: string) {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setHistory(data.history);
    } catch {
      setHistory([]);
    }
  }

  async function pollNotifications(sessionId: string) {
    try {
      const response = await fetch(`/api/chat/notifications?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const nextCount = Number(data.unreadCount ?? 0);
      if (nextCount > previousUnreadRef.current) setShowNotificationBanner(true);
      previousUnreadRef.current = nextCount;
      setUnreadCount(nextCount);
    } catch {
      setUnreadCount(0);
    }
  }

  async function logout() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/chat/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSession(data);
      setHistory([]);
      setShowHistory(false);
      setShowSideMenu(false);
      window.localStorage.setItem("chat_session_id", data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng xuất.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || !session || sending) return;

    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      sender: "USER",
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    setOptimisticMessages((items) => [...items, optimisticMessage]);
    setInput("");
    setSending(true);
    setError("");
    setShowCommands(false);
    setShowSideMenu(false);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, message: trimmed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSession(data);
      setOptimisticMessages([]);
      window.localStorage.setItem("chat_session_id", data.id);
      if (trimmed.toLowerCase() === "/thongbao") setShowNotificationBanner(false);
    } catch (err) {
      setOptimisticMessages((items) => items.filter((item) => item.id !== optimisticMessage.id));
      setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await sendMessage(input);
  }

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col bg-white shadow-soft md:my-6 md:h-[calc(100dvh-48px)] md:overflow-hidden md:rounded-lg">
      <header className="flex items-center justify-between gap-3 border-b border-red-100 bg-brand-red px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="Hoàn Tiền Mua Hàng" className="h-10 w-10 shrink-0 rounded-xl bg-white p-1" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">Bot Hoàn tiền Shopee, Tiktok</h1>
            <p className="mt-0.5 truncate text-xs text-white/80">{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? <ShieldCheck className="h-5 w-5 text-white" /> : null}
          {session?.user ? (
            <button
              className="relative grid h-9 w-9 place-items-center rounded-md border border-white/30 bg-white/10"
              onClick={() => setShowHistory((value) => !value)}
              title="Lịch sử chat"
            >
              <History className="h-4 w-4" />
              {unreadCount > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-white px-1 text-[10px] font-bold text-brand-red">{unreadCount}</span> : null}
            </button>
          ) : null}
          <button
            onClick={() => setShowSideMenu(true)}
            className="grid h-9 w-9 place-items-center rounded-md bg-white text-brand-red"
            title="Menu"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <SideMenu
        open={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        onChat={() => {
          setShowSideMenu(false);
          setShowHistory(false);
        }}
        onSupport={() => sendMessage("/hotro")}
        onLogout={logout}
      />

      <section className="flex-1 overflow-y-auto bg-white px-3 py-4">
        {session?.user ? (
          <div className="mb-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-brand-ink">
            <span className="font-semibold">Đang đăng nhập:</span> {accountLabel}
          </div>
        ) : null}

        {showNotificationBanner && unreadCount > 0 ? (
          <button
            onClick={() => sendMessage("/thongbao")}
            className="mb-3 flex w-full items-center justify-between rounded-md border border-brand-red bg-red-50 px-3 py-2 text-left text-sm text-brand-ink"
          >
            <span>Bạn có {unreadCount} thông báo chưa đọc.</span>
            <span className="font-semibold text-brand-red">Xem</span>
          </button>
        ) : null}

        {showHistory && session?.user ? (
          <div className="mb-3 rounded-lg border border-red-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Lịch sử chat của {accountLabel}</h2>
              <button className="text-xs text-brand-red" onClick={() => setShowHistory(false)}>
                Đóng
              </button>
            </div>
            <div className="grid gap-2">
              {history.length ? (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => restoreSession(item.id)}
                    className={`rounded-md border p-2 text-left text-xs ${item.id === session.id ? "border-brand-red bg-red-50" : "border-red-100 bg-white"}`}
                  >
                    <span className="block font-semibold">{new Date(item.updatedAt).toLocaleString("vi-VN")}</span>
                    <span className="line-clamp-1 text-neutral-600">{item.lastMessage}</span>
                    <span className="text-neutral-400">{item.messageCount} tin nhắn</span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-neutral-500">Chưa có lịch sử chat cho tài khoản này.</p>
              )}
            </div>
          </div>
        ) : null}

        {loading ? <div className="rounded-md border border-red-100 bg-white p-4 text-sm text-neutral-600">Đang mở phiên chat...</div> : null}

        {session?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} onSend={sendMessage} />
        ))}
        {optimisticMessages.map((message) => (
          <MessageBubble key={message.id} message={message} onSend={sendMessage} />
        ))}

        {sending ? (
          <div className="mb-3 flex justify-start">
            <div className="rounded-lg border border-red-100 bg-white px-4 py-3 text-sm text-neutral-500">Bot đang kiểm tra...</div>
          </div>
        ) : null}
        <div ref={scrollRef} />
      </section>

      {error ? <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={onSubmit} className="safe-bottom relative flex gap-2 border-t border-red-100 bg-white px-3 pt-3">
        {showCommands ? (
          <div className="fixed inset-0 z-30" onClick={() => setShowCommands(false)}>
            <div className="absolute bottom-[76px] left-3 max-h-80 w-64 overflow-y-auto rounded-md border border-red-100 bg-white p-2 shadow-soft" onClick={(event) => event.stopPropagation()}>
              {quickCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.command} type="button" onClick={() => sendMessage(item.command)} className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-red-50">
                    <Icon className="h-4 w-4 text-brand-red" />
                    <span>{item.label}</span>
                    <span className="ml-auto text-xs text-neutral-400">{item.command}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <button type="button" onClick={() => setShowCommands((value) => !value)} className="h-10 shrink-0 self-center rounded-md border border-brand-red bg-white px-2.5 text-xs font-semibold text-brand-red" title="Lệnh nhanh">
          Lệnh nhanh
        </button>
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={sending} placeholder={session?.user ? "Dán link Shopee hoặc TikTok Shop..." : "Nhập 1 để đăng nhập, 2 để đăng ký..."} className="min-w-0 flex-1 rounded-md border border-red-100 px-4 text-base outline-none focus:border-brand-red disabled:bg-neutral-50" />
        <button type="submit" disabled={sending || !input.trim()} className="grid h-12 w-12 place-items-center rounded-md bg-brand-red text-white disabled:opacity-50" title="Gửi">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </main>
  );
}

function SideMenu({
  open,
  onClose,
  onChat,
  onSupport,
  onLogout
}: {
  open: boolean;
  onClose: () => void;
  onChat: () => void;
  onSupport: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  const items = [
    { label: "Chat", icon: MessageCircle, action: onChat },
    { label: "Hỗ trợ", icon: Headphones, action: onSupport },
    { label: "Đăng xuất", icon: LogOut, action: onLogout }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-72 max-w-[calc(100vw-32px)] flex-col bg-white shadow-soft"
        onClick={(event) => event.stopPropagation()}
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b border-red-100 bg-brand-red px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Hoàn Tiền Mua Hàng" className="h-9 w-9 rounded-lg bg-white p-1" />
            <h2 className="text-base font-semibold">Menu</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md bg-white/10" title="Đóng menu" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid gap-1 p-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-brand-ink hover:bg-red-50"
              >
                <Icon className="h-5 w-5 text-brand-red" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

function MessageBubble({ message, onSend }: { message: ChatMessage; onSend: (message: string) => void }) {
  const isUser = message.sender === "USER";
  const cashback = !isUser ? parseCashbackCard(message.content) : null;
  const loginError = !isUser ? parseLoginErrorCard(message.content) : null;

  return (
    <div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {cashback ? (
        <CashbackCard data={cashback} />
      ) : loginError ? (
        <LoginErrorCard data={loginError} onSend={onSend} />
      ) : (
        isUser ? (
          <div className="max-w-[84%] whitespace-pre-line rounded-lg bg-brand-red px-4 py-3 text-sm leading-relaxed text-white">{message.content}</div>
        ) : (
          <BotCard content={message.content} onSend={onSend} />
        )
      )}
    </div>
  );
}

function BotCard({ content, onSend }: { content: string; onSend: (message: string) => void }) {
  if (isAuthStartMessage(content)) return <AuthChoiceCard onSend={onSend} />;

  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const title = lines[0] ?? "Thông báo";
  const body = lines.slice(1);

  if (!body.length) return <SimpleBotCard content={title} />;

  const theme = getCardTheme(title);
  const Icon = theme.icon;

  return (
    <div className="w-full max-w-[92%] overflow-hidden rounded-lg border border-red-100 bg-white text-brand-ink shadow-sm sm:max-w-md">
      <div className="flex items-center gap-2.5 border-b border-red-100 bg-red-50 px-3 py-2.5">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${theme.tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-5">{title.replace(/:$/, "")}</h2>
        </div>
      </div>
      <div className="px-3 py-2.5 text-sm leading-relaxed">
        {isOrderTitle(title) ? (
          <OrderList lines={body} />
        ) : isSupportTitle(title) ? (
          <SupportLinks lines={body} />
        ) : (
          <div className="grid gap-1.5">
            {body.map((line, index) => (
              <BotCardLine key={`${line}-${index}`} line={line} />
            ))}
          </div>
          )}
      </div>
    </div>
  );
}

function SimpleBotCard({ content }: { content: string }) {
  return (
    <div className="max-w-[92%] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-700 shadow-sm sm:max-w-md">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sky-50 text-sky-700">
          <MessageCircle className="h-3.5 w-3.5" />
        </span>
        <p>{content}</p>
      </div>
    </div>
  );
}

function AuthChoiceCard({ onSend }: { onSend: (message: string) => void }) {
  return (
    <div className="w-full max-w-[92%] overflow-hidden rounded-lg border border-red-100 bg-white text-brand-ink shadow-sm sm:max-w-md">
      <div className="flex items-center gap-2.5 border-b border-red-100 bg-gradient-to-r from-red-50 to-amber-50 px-3 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-red text-white">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Chào mừng bạn</h2>
          <p className="mt-0.5 text-xs text-neutral-600">Chọn thao tác để bắt đầu tạo link hoàn tiền.</p>
        </div>
      </div>
      <div className="grid gap-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onSend("1")} className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-red px-3 text-sm font-semibold text-white">
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </button>
          <button type="button" onClick={() => onSend("2")} className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-brand-red bg-white px-3 text-sm font-semibold text-brand-red">
            <UserRound className="h-4 w-4" />
            Đăng ký
          </button>
        </div>
        <div className="flex items-start gap-2 rounded-md bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800 ring-1 ring-sky-100">
          <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Chọn Lệnh nhanh để thực hiện các thao tác nhanh như xem đơn hàng, số dư hoặc rút tiền.</span>
        </div>
      </div>
    </div>
  );
}

function LoginErrorCard({ data, onSend }: { data: LoginErrorData; onSend: (message: string) => void }) {
  return (
    <div className="w-full max-w-[92%] overflow-hidden rounded-lg border border-amber-200 bg-white text-brand-ink shadow-sm sm:max-w-md">
      <div className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-50 px-3 py-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{data.title || "Đăng nhập chưa thành công"}</h2>
          <p className="mt-0.5 text-xs text-neutral-600">Bạn có thể thử lại từ đầu hoặc đặt lại mật khẩu.</p>
        </div>
      </div>
      <div className="grid gap-3 p-3">
        <p className="text-sm leading-relaxed text-neutral-700">{data.message || "Email hoặc mật khẩu chưa đúng."}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onSend("/nhaplai")} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-red px-3 text-xs font-semibold text-white">
            <LogIn className="h-3.5 w-3.5" />
            Nhập lại email
          </button>
          <button type="button" onClick={() => onSend("/quenmatkhau")} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-700 hover:bg-amber-50">
            <AlertCircle className="h-3.5 w-3.5" />
            Quên mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderList({ lines }: { lines: string[] }) {
  const groups: string[][] = [];
  lines.forEach((line) => {
    if (/^\d+\./.test(line) || groups.length === 0) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });

  return (
    <div className="grid gap-2">
      {groups.map((group, index) => {
        const name = group[0]?.replace(/^\d+\.\s*/, "") || `Đơn hàng ${index + 1}`;
        const cashback = group.find((line) => line.toLowerCase().startsWith("tiền hoàn dự kiến"));
        const statusLine = group.find((line) => line.toLowerCase().startsWith("trạng thái"));
        const status = normalizeStatus(statusLine?.split(":").slice(1).join(":") ?? "");
        const StatusIcon = status.icon;

        return (
          <div key={`${name}-${index}`} className="relative rounded-md border border-red-100 bg-white px-3 pb-2.5 pt-3.5">
            <span className="absolute left-2.5 top-0 grid h-4 min-w-4 -translate-y-1/2 place-items-center rounded-full bg-neutral-100 px-1 text-[10px] font-semibold text-neutral-600 ring-1 ring-red-100">
              {index + 1}
            </span>
            <p className="line-clamp-2 text-sm font-semibold leading-5">{name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${status.className}`}>
                <StatusIcon className="h-2.5 w-2.5" />
                {status.label}
              </span>
              {cashback ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-red-100">
                  <span className="text-neutral-500">Tiền hoàn dự kiến</span>
                  <span className="text-brand-red">{cashback.split(":").slice(1).join(":").trim()}</span>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SupportLinks({ lines }: { lines: string[] }) {
  const phone = lines.find((line) => line.toLowerCase().startsWith("điện thoại"))?.split(":").slice(1).join(":").trim();
  const zalo = lines.find((line) => line.toLowerCase().startsWith("zalo"))?.split(":").slice(1).join(":").trim();
  const email = lines.find((line) => line.toLowerCase().startsWith("email"))?.split(":").slice(1).join(":").trim();
  const site = lines.find((line) => line.toLowerCase().startsWith("trang chính thức"))?.split(":").slice(1).join(":").trim();
  const time = lines.find((line) => line.toLowerCase().startsWith("thời gian"));

  return (
    <div className="grid gap-2">
      {phone ? <SupportAction href={`tel:${phone}`} icon={Headphones} label="Gọi hỗ trợ" value={phone} /> : null}
      {zalo ? <SupportAction href={zalo} icon={MessageCircle} label="Chat Zalo" value="Mở nhóm hỗ trợ" /> : null}
      {email ? <SupportAction href={`mailto:${email}`} icon={Bell} label="Gửi email" value={email} /> : null}
      {site ? <SupportAction href={site} icon={ExternalLink} label="Trang chính thức" value="hoantienmuahang.vn" /> : null}
      {time ? (
        <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
          <Clock3 className="h-3.5 w-3.5 text-brand-red" />
          <span>{time}</span>
        </div>
      ) : null}
    </div>
  );
}

function SupportAction({ href, icon: Icon, label, value }: { href: string; icon: typeof Headphones; label: string; value: string }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="flex items-center gap-2 rounded-md border border-red-100 px-3 py-2 hover:bg-red-50">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-red-50 text-brand-red">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-neutral-500">{label}</span>
        <span className="block truncate text-sm font-semibold text-brand-ink">{value}</span>
      </span>
    </a>
  );
}

function CopyAmountButton({ value }: { value: string }) {
  async function copy() {
    await navigator.clipboard?.writeText(value.replace(/[^\d]/g, ""));
  }

  return (
    <button type="button" onClick={copy} className="ml-auto shrink-0 rounded-md border border-red-100 bg-white px-2 py-1 text-[10px] font-semibold text-brand-red hover:bg-red-50" title="Copy số tiền">
      Copy
    </button>
  );
}

function BotCardLine({ line }: { line: string }) {
  const statusMatch = line.match(/^(Trạng thái|Trạng thái đơn|Tình trạng):\s*(.+)$/i);
  if (statusMatch) {
    const status = normalizeStatus(statusMatch[2]);
    const Icon = status.icon;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{statusMatch[1]}:</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${status.className}`}>
          <Icon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>
    );
  }

  const moneyMatch = line.match(/^(Số dư ví|Hoàn tiền|Số tiền|Hoa hồng|Tiền hoàn|Tiền hoàn dự kiến|Đơn đã duyệt|Người giới thiệu):\s*(.+)$/i);
  if (moneyMatch) {
    const value = moneyMatch[2];
    return (
      <div className="flex items-center gap-2 rounded-md bg-red-50 px-2.5 py-1.5">
        <CreditCard className="h-3.5 w-3.5 shrink-0 text-brand-red" />
        <p className="min-w-0">
          <span className="font-semibold">{moneyMatch[1]}: </span>
          <span className="font-semibold text-brand-red">{value}</span>
        </p>
        <CopyAmountButton value={value} />
      </div>
    );
  }

  const bankMatch = line.match(/^(Ngân hàng|Số tài khoản|Chủ tài khoản|Phương thức|Email|Họ tên):\s*(.+)$/i);
  if (bankMatch) {
    return (
      <div className="flex items-center gap-2">
        <Landmark className="h-3.5 w-3.5 shrink-0 text-brand-red" />
        <p>
          <span className="font-medium">{bankMatch[1]}: </span>
          <span>{bankMatch[2]}</span>
        </p>
      </div>
    );
  }

  if (/^https?:\/\//i.test(line) || line.includes("/ruttien")) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-2.5 py-1.5 font-mono text-xs text-neutral-700">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-brand-red" />
        <span className="break-all">{line}</span>
      </div>
    );
  }

  if (/^[-•]|\d+\./.test(line)) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span>{line.replace(/^[-•]\s*/, "")}</span>
      </div>
    );
  }

  if (line.toLowerCase().includes("không chịu trách nhiệm")) {
    return (
      <div className="rounded-md bg-amber-50 px-2.5 py-1.5 text-amber-800">
        <span>{line}</span>
      </div>
    );
  }

  return <p className="py-0.5 text-neutral-700">{line}</p>;
}

function CashbackCard({ data }: { data: CashbackCardData }) {
  return (
    <div className="w-full max-w-[92%] overflow-hidden rounded-lg border border-red-100 bg-white text-brand-ink shadow-sm sm:max-w-md">
      <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-red text-white">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Kiểm tra xong</h2>
          <p className="mt-0.5 text-xs text-neutral-600">Link hoàn tiền đã sẵn sàng.</p>
        </div>
      </div>
      <div className="p-4">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-neutral-500">Tên sản phẩm</dt>
            <dd className="mt-1 font-semibold">{data.productName || "Sản phẩm Shopee/TikTok Shop"}</dd>
          </div>
          <div className="rounded-md bg-red-50 px-3 py-2">
            <dt className="text-xs font-semibold uppercase text-neutral-500">Hoa hồng dự kiến</dt>
            <dd className="mt-1 text-lg font-bold text-brand-red">{data.cashbackAmount || "Đang cập nhật"}</dd>
          </div>
        </dl>
        <a href={data.affiliateUrl} target="_blank" rel="noreferrer" className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-red px-3 py-2 text-center text-sm font-semibold text-white">
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span>Quay lại sàn Shopee, Tiktok để mua hàng</span>
        </a>
        {data.transId ? <p className="mt-2 break-all text-xs text-neutral-500">Mã giao dịch: <span className="font-semibold text-brand-ink">{data.transId}</span></p> : null}
        <div className="mt-4 grid gap-2 rounded-md bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700">
          <p className="flex items-center gap-2 font-semibold text-brand-ink">
            <Info className="h-4 w-4 text-brand-red" />
            Lưu ý
          </p>
          <p>1. Để giỏ hàng trống khi mua hàng</p>
          <p>2. Ấn 2 lần link để bảo đảm chuyển đổi</p>
        </div>
      </div>
    </div>
  );
}
