"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  Clipboard,
  Clock3,
  ExternalLink,
  HandCoins,
  Headphones,
  History,
  ListChecks,
  LoaderCircle,
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
import type { AppNoticeDto, ChatHistoryItem, ChatMessage, ChatSessionPayload } from "@/types/app";
import { LandingPage } from "@/components/landing-page";

type CashbackCardData = {
  productName?: string;
  productImage?: string;
  platform?: "shopee" | "tiktok" | "shop";
  affiliateUrl: string;
  cashbackAmount?: string;
  transId?: string;
};

type LoginErrorData = {
  title?: string;
  message?: string;
};

type ProactiveNotice = { id: string; title: string; message: string; actionUrl?: string | null };
type PublicPageItem = { slug: string; title: string };
type PublicPage = PublicPageItem & { content: string; metaDescription?: string; updatedAt?: string | null };

type AuthMode = "login" | "register" | "forgot" | "2fa";

const quickCommands = [
  { label: "Hướng dẫn", command: "/huongdan", icon: BookOpen },
  { label: "Số dư", command: "/taikhoan", icon: WalletCards },
  { label: "Đơn hàng", command: "/donhang", icon: PackageCheck },
  { label: "Rút tiền", command: "__withdraw__", icon: WalletCards },
  { label: "Lịch sử rút", command: "/lichsurut", icon: History },
  { label: "Thông báo", command: "/thongbao", icon: Bell },
  { label: "Nhiệm vụ", command: "/nhiemvu", icon: ListChecks },
  { label: "Giới thiệu", command: "/gioithieu", icon: UserRound },
  { label: "Biến động ví", command: "/biendongsodu", icon: WalletCards },
  { label: "Nhật ký", command: "/nhatky", icon: Clock3 },
  { label: "Bảo mật", command: "/baomat", icon: ShieldCheck },
  { label: "Phiên đăng nhập", command: "/phien", icon: History },
  { label: "Tra soát đơn", command: "__ticket__", icon: Headphones },
  { label: "Hỗ trợ", command: "/hotro", icon: Headphones },
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

function detectLinkPlatform(value: string) {
  const normalized = value.toLowerCase();
  if (/(tiktok\.com|vt\.tiktok\.com|tiktokshop)/.test(normalized)) return "TikTok Shop";
  if (/(shopee\.vn|shp\.ee|shopee)/.test(normalized)) return "Shopee";
  return null;
}

function extractShoppingLink(value: string) {
  const links = value.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  return links.find((link) => detectLinkPlatform(link))?.replace(/[),.;!?]+$/, "") ?? null;
}

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase();
  if (["approved", "success", "completed", "paid", "done", "đã duyệt", "thành công", "hoàn tất"].some((item) => status.includes(item))) {
    return { label: "Thành công", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", dotClassName: "bg-emerald-500" };
  }
  if (["pending", "processing", "in_progress", "waiting", "chờ", "đang"].some((item) => status.includes(item))) {
    return { label: "Đang xét duyệt", className: "bg-amber-50 text-amber-700 ring-amber-200", dotClassName: "bg-amber-400" };
  }
  if (["claimed", "đã nhận"].some((item) => status.includes(item))) {
    return { label: "Đã nhận thưởng", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", dotClassName: "bg-emerald-500" };
  }
  if (["rejected", "cancelled", "failed", "deny", "hủy", "từ chối", "thất bại"].some((item) => status.includes(item))) {
    return { label: "Từ chối", className: "bg-red-50 text-red-700 ring-red-200", dotClassName: "bg-red-500" };
  }
  return { label: value.trim() || "Đang cập nhật", className: "bg-neutral-100 text-neutral-700 ring-neutral-200", dotClassName: "bg-neutral-400" };
}

function getLineStatusTone(line: string) {
  const normalized = line.toLowerCase();
  if (["thành công", "đã duyệt", "hoàn tất", "đã sẵn sàng", "success", "completed"].some((item) => normalized.includes(item))) {
    return "bg-emerald-500";
  }
  if (["đang xét duyệt", "đang xử lý", "chờ", "pending", "processing", "waiting"].some((item) => normalized.includes(item))) {
    return "bg-amber-400";
  }
  if (["từ chối", "thất bại", "không thành công", "hủy", "failed", "rejected"].some((item) => normalized.includes(item))) {
    return "bg-red-500";
  }
  return null;
}

function splitLabelValue(line: string) {
  const index = line.indexOf(":");
  if (index < 1) return null;
  return {
    label: line.slice(0, index).trim(),
    value: line.slice(index + 1).trim()
  };
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

function isAccountTitle(title: string) {
  const normalized = title.toLowerCase();
  return normalized.includes("thông tin tài khoản") || normalized.includes("tổng quan tài khoản");
}

function isWithdrawalHistoryTitle(title: string) {
  const normalized = title.toLowerCase();
  return normalized.includes("lịch sử rút tiền") || normalized.includes("lần rút tiền gần đây");
}

function isTaskTitle(title: string) {
  return title.toLowerCase().includes("nhiệm vụ nhận thưởng");
}

function isNotificationTitle(title: string) {
  return title.toLowerCase().includes("thông báo chưa đọc");
}

function isReferralTitle(title: string) {
  const normalized = title.toLowerCase();
  return normalized.includes("chương trình giới thiệu") || normalized.includes("giới thiệu cho bạn bè");
}

function isBalanceActivityTitle(title: string) {
  return title.toLowerCase().includes("biến động số dư");
}

function isSecurityTitle(title: string) {
  return title.toLowerCase().includes("trạng thái bảo mật");
}

function isSessionsTitle(title: string) {
  return title.toLowerCase().includes("các phiên đăng nhập");
}

function isSmartGuideTitle(title: string) {
  const normalized = title.toLowerCase();
  return normalized.includes("dùng ry rất đơn giản") || normalized.includes("ry hướng dẫn") || normalized.includes("ry có thể giúp gì");
}

function isActivityTitle(title: string) {
  return title.toLowerCase().includes("nhật ký hoạt động");
}

function isAuthStartMessage(content: string) {
  const normalized = content.toLowerCase();
  return normalized.includes("có tài khoản chọn 1") && normalized.includes("chưa có tài khoản chọn 2");
}

export function ChatApp() {
  const [session, setSession] = useState<ChatSessionPayload | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [clipboardSuggestion, setClipboardSuggestion] = useState<{ link: string; platform: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirmation, setAuthPasswordConfirmation] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authReferralCode, setAuthReferralCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingTwoFactorSessionId, setPendingTwoFactorSessionId] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [sending, setSending] = useState(false);
  const [pushState, setPushState] = useState<"idle" | "enabling" | "enabled" | "unsupported" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [pushEndpoint, setPushEndpoint] = useState("");
  const [showPushSettings, setShowPushSettings] = useState(false);
  const [pushQuietStart, setPushQuietStart] = useState("22:00");
  const [pushQuietEnd, setPushQuietEnd] = useState("08:00");
  const [pushCategories, setPushCategories] = useState(["REMINDER", "ORDER", "CASHBACK", "SUPPORT"]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketInitialCategory, setTicketInitialCategory] = useState("MISSING_ORDER");
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawalInitialAmount, setWithdrawalInitialAmount] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [appNotice, setAppNotice] = useState<AppNoticeDto | null>(null);
  const [appNoticeSecondsLeft, setAppNoticeSecondsLeft] = useState(0);
  const [proactiveNotices, setProactiveNotices] = useState<ProactiveNotice[]>([]);
  const [publicPage, setPublicPage] = useState<PublicPage | null>(null);
  const [publicPageLoading, setPublicPageLoading] = useState(false);
  const previousUnreadRef = useRef(0);
  const dismissedClipboardRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAppNotice();
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get("ref") ?? params.get("referral_code");
    if (referralCode) {
      setAuthReferralCode(referralCode);
      setAuthMode("register");
      setShowAuth(true);
    }
    const existing = window.localStorage.getItem("chat_session_id");
    if (existing) {
      restoreSession(existing);
      return;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!appNotice || appNoticeSecondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setAppNoticeSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [appNotice, appNoticeSecondsLeft]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, optimisticMessages.length, sending]);

  useEffect(() => {
    if (!session?.user || !navigator.clipboard?.readText) return;

    async function detectClipboardLink() {
      if (document.visibilityState !== "visible") return;
      try {
        const clipboardText = await navigator.clipboard.readText();
        const link = extractShoppingLink(clipboardText);
        const platform = link ? detectLinkPlatform(link) : null;
        if (link && platform && link !== dismissedClipboardRef.current && link !== input.trim()) {
          setClipboardSuggestion({ link, platform });
        }
      } catch {
        // Clipboard access varies by mobile browser. The manual paste button remains available.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void detectClipboardLink();
    };
    const timer = window.setTimeout(() => void detectClipboardLink(), 350);
    window.addEventListener("focus", detectClipboardLink);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", detectClipboardLink);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session?.user, input]);

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

  useEffect(() => {
    if (!session?.user) {
      setPushState("idle");
      setPushMessage("");
      return;
    }

    async function syncRegisteredDevice() {
      try {
        const push = await import("@/lib/web-push-client");
        if (!push.isWebPushSupported()) {
          setPushState("unsupported");
          return;
        }

        const subscription = await push.getCurrentPushSubscription();
        if (subscription) {
          await registerPushSubscription(subscription);
          setPushEndpoint(subscription.endpoint);
          await loadPushPreferences(subscription.endpoint);
          setPushState("enabled");
          return;
        }

        if (Notification.permission === "granted") {
          const nextSubscription = await push.registerForPushNotifications();
          await registerPushSubscription(nextSubscription);
          setPushEndpoint(nextSubscription.endpoint);
          setPushState("enabled");
        }
      } catch {
        setPushState("error");
      }
    }

    void syncRegisteredDevice();
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
      if (!data.user) {
        window.localStorage.removeItem("chat_session_id");
        setSession(null);
        return;
      }
      setSession(data);
      window.localStorage.setItem("chat_session_id", data.id);
    } catch {
      window.localStorage.removeItem("chat_session_id");
      setSession(null);
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
      setError(err instanceof Error ? err.message : "Ry chưa mở được cuộc trò chuyện. Bạn tải lại trang giúp Ry nhé.");
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

  async function loadAppNotice() {
    try {
      const response = await fetch("/api/chat/app-notice");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!data.notice) {
        setAppNotice(null);
        setAppNoticeSecondsLeft(0);
        return;
      }
      setAppNotice(data.notice);
      setAppNoticeSecondsLeft(Number(data.notice.displaySeconds ?? 10));
    } catch {
      setAppNotice(null);
      setAppNoticeSecondsLeft(0);
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
      const proactiveResponse = await fetch("/api/chat/proactive");
      if (proactiveResponse.ok) {
        const proactiveData = await proactiveResponse.json();
        setProactiveNotices(proactiveData.notifications ?? []);
      }
    } catch {
      setUnreadCount(0);
    }
  }

  async function logout() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      try {
        const push = await import("@/lib/web-push-client");
        const subscription = await push.getCurrentPushSubscription();
        if (subscription) {
          await fetch("/api/push/subscriptions", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId: session.id, endpoint: subscription.endpoint })
          });
          await push.unregisterFromPushNotifications();
        }
      } catch {
        // Device cleanup is best-effort and must not prevent account logout.
      }
      await fetch("/api/chat/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      setSession(null);
      setHistory([]);
      setShowHistory(false);
      setShowSideMenu(false);
      window.localStorage.removeItem("chat_session_id");
      setPushEndpoint("");
      setShowPushSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ry chưa đăng xuất được. Bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  async function registerPushSubscription(subscription: PushSubscription) {
    if (!session) throw new Error("Chưa có phiên đăng nhập.");
    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        subscription: subscription.toJSON()
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Không thể đăng ký thiết bị.");
  }

  async function loadPushPreferences(endpoint: string) {
    if (!session) return;
    const response = await fetch(`/api/push/subscriptions?sessionId=${encodeURIComponent(session.id)}`);
    if (!response.ok) return;
    const data = await response.json();
    const item = (data.subscriptions ?? []).find((entry: { endpoint?: string }) => entry.endpoint === endpoint);
    if (!item) return;
    setPushQuietStart(item.quietStart || "22:00");
    setPushQuietEnd(item.quietEnd || "08:00");
    try {
      const categories = JSON.parse(item.categories || "[]");
      if (Array.isArray(categories) && categories.length) setPushCategories(categories);
    } catch {}
  }

  async function enablePushNotifications() {
    setPushState("enabling");
    setPushMessage("");
    try {
      const push = await import("@/lib/web-push-client");
      const subscription = await push.registerForPushNotifications();
      await registerPushSubscription(subscription);
      setPushEndpoint(subscription.endpoint);
      setPushState("enabled");
      setPushMessage("Thiết bị này đã bật thông báo đẩy.");
    } catch (err) {
      setPushState("error");
      setPushMessage(err instanceof Error ? err.message : "Không thể bật thông báo.");
    }
  }

  async function savePushPreferences() {
    if (!session || !pushEndpoint) return;
    setPushState("enabling");
    setPushMessage("");
    try {
      const response = await fetch("/api/push/subscriptions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          endpoint: pushEndpoint,
          quietStart: pushQuietStart,
          quietEnd: pushQuietEnd,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh",
          categories: pushCategories
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Không thể lưu cài đặt.");
      setPushState("enabled");
      setPushMessage("Đã lưu cài đặt thông báo.");
      setShowPushSettings(false);
    } catch (err) {
      setPushState("error");
      setPushMessage(err instanceof Error ? err.message : "Không thể lưu cài đặt.");
    }
  }

  async function disablePushNotifications() {
    if (!session || !pushEndpoint) return;
    setPushState("enabling");
    try {
      await fetch("/api/push/subscriptions", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, endpoint: pushEndpoint })
      });
      const push = await import("@/lib/web-push-client");
      await push.unregisterFromPushNotifications();
      setPushEndpoint("");
      setShowPushSettings(false);
      setPushMessage("Đã tắt thông báo trên thiết bị này.");
      setPushState("idle");
    } catch (err) {
      setPushMessage(err instanceof Error ? err.message : "Không thể tắt thông báo.");
      setPushState("error");
    }
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAuthMessage("");
    const normalizedEmail = authEmail.trim().toLowerCase();

    try {
      const body =
        authMode === "register"
          ? {
              mode: "register",
              email: normalizedEmail,
              password: authPassword,
              passwordConfirmation: authPasswordConfirmation,
              name: authName,
              phone: authPhone,
              referralCode: authReferralCode
            }
          : authMode === "forgot"
            ? { mode: "forgot", email: normalizedEmail }
            : authMode === "2fa"
              ? { mode: "2fa", sessionId: pendingTwoFactorSessionId, code: twoFactorCode }
              : { mode: "login", email: normalizedEmail, password: authPassword };

      const response = await fetch("/api/chat/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (authMode === "forgot") {
        setAuthMessage(data.message || "Nếu email này có tài khoản, Ry đã gửi hướng dẫn đặt lại mật khẩu rồi nhé.");
        setAuthMode("login");
        return;
      }

      if (!data.user) {
        setPendingTwoFactorSessionId(data.id);
        setAuthMode("2fa");
        setAuthMessage("Bạn nhập mã xác thực để Ry hoàn tất đăng nhập nhé.");
        return;
      }

      setSession(data);
      window.localStorage.setItem("chat_session_id", data.id);
      setAuthPassword("");
      setAuthPasswordConfirmation("");
      setTwoFactorCode("");
      setPendingTwoFactorSessionId("");
      setAuthMessage("");
      setShowAuth(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ry chưa xác thực được thông tin. Bạn kiểm tra rồi thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (trimmed.startsWith("__page__:")) {
      void openPublicPage(trimmed.slice("__page__:".length));
      return;
    }
    if (trimmed.startsWith("__ticket__")) {
      setTicketInitialCategory(trimmed.split(":")[1] || "MISSING_ORDER");
      setShowTicket(true);
      return;
    }
    if (trimmed.startsWith("__withdraw__")) {
      setWithdrawalInitialAmount(trimmed.split(":")[1] ?? "");
      setShowWithdrawal(true);
      return;
    }
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
      const latestBotMessage = [...(data.messages ?? [])].reverse().find((item: ChatMessage) => item.sender === "BOT");
      if (latestBotMessage?.content?.startsWith("TICKET_FORM:")) {
        try {
          const ticketData = JSON.parse(latestBotMessage.content.slice("TICKET_FORM:".length)) as { category?: string };
          setTicketInitialCategory(ticketData.category || "MISSING_ORDER");
        } catch {
          setTicketInitialCategory("MISSING_ORDER");
        }
        setShowTicket(true);
      }
      if (latestBotMessage?.content?.startsWith("STATIC_PAGE:")) {
        try {
          const pageData = JSON.parse(latestBotMessage.content.slice("STATIC_PAGE:".length)) as { slug?: string };
          if (pageData.slug) void openPublicPage(pageData.slug);
        } catch {}
      }
      window.localStorage.setItem("chat_session_id", data.id);
      if (trimmed.toLowerCase() === "/thongbao") setShowNotificationBanner(false);
    } catch (err) {
      setOptimisticMessages((items) => items.filter((item) => item.id !== optimisticMessage.id));
      setError(err instanceof Error ? err.message : "Tin nhắn chưa gửi được. Bạn thử lại giúp Ry nhé.");
    } finally {
      setSending(false);
    }
  }

  async function openPublicPage(slug: string) {
    setShowSideMenu(false);
    setPublicPageLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/pages/${encodeURIComponent(slug)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Chưa thể tải nội dung.");
      setPublicPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa thể tải nội dung trang.");
    } finally {
      setPublicPageLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) {
        setInput((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${text}`.trimStart());
        setError("");
      }
    } catch {
      setError("Trình duyệt chưa cho phép dán tự động. Bạn có thể dán bằng Ctrl+V.");
    }
  }

  const detectedLinkPlatform = detectLinkPlatform(input);

  if (!session?.user) {
    if (!showAuth) {
      return (
        <LandingPage
          onLogin={() => {
            setAuthMode("login");
            setShowAuth(true);
          }}
          onRegister={() => {
            setAuthMode("register");
            setShowAuth(true);
          }}
        />
      );
    }

    return (
      <AuthScreen
        mode={authMode}
        loading={loading}
        error={error}
        message={authMessage}
        email={authEmail}
        password={authPassword}
        passwordConfirmation={authPasswordConfirmation}
        name={authName}
        phone={authPhone}
        referralCode={authReferralCode}
        twoFactorCode={twoFactorCode}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setError("");
          setAuthMessage("");
        }}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onPasswordConfirmationChange={setAuthPasswordConfirmation}
        onNameChange={setAuthName}
        onPhoneChange={setAuthPhone}
        onReferralCodeChange={setAuthReferralCode}
        onTwoFactorCodeChange={setTwoFactorCode}
        onSubmit={submitAuth}
        appNotice={appNotice}
        appNoticeSecondsLeft={appNoticeSecondsLeft}
        onBack={() => {
          setShowAuth(false);
          setError("");
          setAuthMessage("");
        }}
      />
    );
  }

  return (
    <main className="chat-compact relative mx-auto flex h-dvh max-w-3xl flex-col overflow-hidden bg-[#eef2f7] shadow-soft md:my-6 md:h-[calc(100dvh-48px)] md:rounded-2xl">
      <header className="safe-top flex min-h-[68px] items-center justify-between gap-3 border-b border-red-950/10 bg-brand-red px-3.5 py-2.5 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/api/site-assets/logo" alt="Hoàn Tiền Mua Hàng" className="h-11 w-11 shrink-0 rounded-full bg-white p-1 object-cover" />
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold">Em Ry · Trợ lý hoàn tiền</h1>
            <p className="mt-0.5 truncate text-[13px] text-white/85">{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? <ShieldCheck className="h-5 w-5 text-white" /> : null}
          {session?.user ? (
            <button
              className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/30 bg-white/10"
              onClick={() => setShowHistory((value) => !value)}
              title="Lịch sử chat"
            >
              <History className="h-4 w-4" />
              {unreadCount > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-white px-1 text-[10px] font-bold text-brand-red">{unreadCount}</span> : null}
            </button>
          ) : null}
          <button
            onClick={() => setShowSideMenu(true)}
            className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-red shadow-sm"
            title="Menu"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AppNoticeBanner notice={appNotice} secondsLeft={appNoticeSecondsLeft} />
      {proactiveNotices[0] ? <ProactiveNoticeBanner notice={proactiveNotices[0]} onClose={async () => { const current = proactiveNotices[0]; setProactiveNotices((items) => items.slice(1)); await fetch("/api/chat/proactive", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: current.id }) }); }} /> : null}

      <SideMenu
        open={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        onChat={() => {
          setShowSideMenu(false);
          setShowHistory(false);
        }}
        onCommand={(command) => {
          setShowSideMenu(false);
          void sendMessage(command);
        }}
        onPage={(slug) => void openPublicPage(slug)}
        pushEnabled={pushState === "enabled"}
        onPushSettings={() => {
          setShowSideMenu(false);
          setShowPushSettings(true);
        }}
        onLogout={logout}
      />

      {showPushSettings ? (
        <DeviceNotificationModal
          state={pushState}
          message={pushMessage}
          quietStart={pushQuietStart}
          quietEnd={pushQuietEnd}
          categories={pushCategories}
          onQuietStart={setPushQuietStart}
          onQuietEnd={setPushQuietEnd}
          onCategories={setPushCategories}
          onEnable={enablePushNotifications}
          onSave={savePushPreferences}
          onDisable={disablePushNotifications}
          onClose={() => setShowPushSettings(false)}
        />
      ) : null}

      <section className="flex-1 overflow-y-auto bg-[#eef2f7] px-2.5 py-3 sm:px-4">
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

        {loading ? (
          <div className="flex items-center gap-2 rounded-md border border-red-100 bg-white p-4 text-sm text-neutral-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-brand-red" />
            Đang mở phiên chat...
          </div>
        ) : null}

        {session?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} onSend={sendMessage} />
        ))}
        {optimisticMessages.map((message) => (
          <MessageBubble key={message.id} message={message} onSend={sendMessage} />
        ))}

        {sending ? (
          <div className="mb-3 flex items-end gap-2">
            <BotAvatar />
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-red" />
              Ry đang kiểm tra, bạn chờ một chút nhé...
            </div>
          </div>
        ) : null}
        <div ref={scrollRef} />
      </section>

      {error ? <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}
      {showTicket ? <TicketForm initialCategory={ticketInitialCategory} onClose={() => setShowTicket(false)} onCreated={(id) => { setShowTicket(false); setError(`Ry đã tạo yêu cầu hỗ trợ #${id.slice(-8)}. Bạn sẽ nhận thông báo khi có phản hồi.`); }} /> : null}
      {showWithdrawal ? <WithdrawalForm initialAmount={withdrawalInitialAmount} onClose={() => setShowWithdrawal(false)} onSuccess={() => { setShowWithdrawal(false); setError("Ry đã gửi yêu cầu rút tiền thành công."); }} /> : null}
      {publicPageLoading ? <div className="absolute inset-0 z-50 grid place-items-center bg-black/30"><div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-medium text-brand-ink shadow-xl"><LoaderCircle className="h-5 w-5 animate-spin text-brand-red" />Đang tải nội dung...</div></div> : null}
      {publicPage ? <PublicPageModal page={publicPage} onClose={() => setPublicPage(null)} /> : null}

      <form onSubmit={onSubmit} className="safe-bottom border-t border-black/5 bg-white pt-2 shadow-[0_-8px_24px_rgba(30,41,59,0.06)]">
        {clipboardSuggestion ? (
          <div className="mx-3 mb-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <Clipboard className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-800">Phát hiện link {clipboardSuggestion.platform}</p>
                <p className="mt-0.5 truncate text-xs text-emerald-700/80">{clipboardSuggestion.link}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const link = clipboardSuggestion.link;
                  dismissedClipboardRef.current = link;
                  setClipboardSuggestion(null);
                  void sendMessage(link);
                }}
                disabled={sending}
                className="flex-1 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                Dùng ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissedClipboardRef.current = clipboardSuggestion.link;
                  setClipboardSuggestion(null);
                }}
                className="rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : null}
        {detectedLinkPlatform ? (
          <p className="mx-3 mb-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
            Ry đã nhận ra link {detectedLinkPlatform}. Bấm gửi để tạo link hoàn tiền.
          </p>
        ) : null}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
          {quickCommands.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.command}
                type="button"
                onClick={() => item.command === "__ticket__" ? setShowTicket(true) : item.command === "__withdraw__" ? setShowWithdrawal(true) : sendMessage(item.command)}
                disabled={sending || !session}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-red-100 bg-white px-2.5 text-xs font-semibold text-brand-ink shadow-sm hover:bg-red-50 disabled:opacity-50"
                title={item.label}
              >
                <Icon className="h-3.5 w-3.5 text-brand-red" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-end gap-2 px-3">
          <div className="relative min-w-0 flex-1">
            <textarea
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              disabled={sending}
              placeholder={session?.user ? "Hỏi Ry hoặc gửi link sản phẩm..." : "Nhắn cho Ry điều bạn cần..."}
              className="max-h-28 min-h-14 w-full min-w-0 resize-none rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-base leading-6 outline-none focus:border-brand-red focus:ring-2 focus:ring-red-100 disabled:bg-neutral-50"
            />
            <button type="button" onClick={pasteFromClipboard} disabled={sending} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-brand-red hover:bg-red-50 disabled:opacity-50" title="Dán" aria-label="Dán">
              <Clipboard className="h-4 w-4" />
            </button>
          </div>
          <button type="submit" disabled={sending || !input.trim()} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-red text-white shadow-sm disabled:opacity-50" title="Gửi">
            {sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </main>
  );
}

function PublicPageModal({ page, onClose }: { page: PublicPage; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-end overflow-y-auto bg-black/40 p-2 sm:place-items-center" onClick={onClose}>
      <article className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-brand-line bg-[#fafaf8] px-4 py-3">
          <div className="min-w-0">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#8a6c35]">Thông tin chính thức</span>
            <h2 className="truncate text-sm font-semibold text-brand-ink">{page.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-brand-line bg-white" aria-label="Đóng"><X className="h-4 w-4" /></button>
        </header>
        <div className="overflow-y-auto px-4 py-4">
          {page.metaDescription ? <p className="mb-4 rounded-lg bg-[#f1f7f4] px-3 py-2 text-[11px] leading-5 text-neutral-600">{page.metaDescription}</p> : null}
          <div className="whitespace-pre-line text-xs leading-6 text-neutral-700">{page.content || "Trang này chưa có nội dung."}</div>
        </div>
        {page.updatedAt ? <footer className="border-t border-brand-line px-4 py-2 text-[10px] text-neutral-400">Cập nhật: {new Date(page.updatedAt).toLocaleString("vi-VN")}</footer> : null}
      </article>
    </div>
  );
}

function WithdrawalForm({ initialAmount, onClose, onSuccess }: { initialAmount: string; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(initialAmount);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!confirmed) return setFormError("Bạn cần xác nhận thông tin ngân hàng đã chính xác.");
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/chat/withdrawals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), bankName, accountNumber, accountName })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Chưa thể gửi yêu cầu rút tiền.");
      onSuccess();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Chưa thể gửi yêu cầu rút tiền.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="absolute inset-0 z-40 grid place-items-end overflow-y-auto bg-black/40 p-2 sm:place-items-center">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-3 shadow-xl">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Rút tiền về ngân hàng</h2><p className="text-[11px] text-neutral-500">Điền và kiểm tra thông tin trước khi gửi.</p></div><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md border"><X className="h-3.5 w-3.5" /></button></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs"><span className="mb-1 block font-medium">Số tiền</span><input required type="number" min={10001} value={amount} onChange={(event) => setAmount(event.target.value)} className="h-10 w-full rounded-md border px-2.5 text-sm" /></label>
          <label className="text-xs"><span className="mb-1 block font-medium">Ngân hàng</span><input required value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Techcombank" className="h-10 w-full rounded-md border px-2.5 text-sm" /></label>
          <label className="text-xs"><span className="mb-1 block font-medium">Số tài khoản</span><input required inputMode="numeric" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))} className="h-10 w-full rounded-md border px-2.5 text-sm" /></label>
          <label className="text-xs"><span className="mb-1 block font-medium">Tên chủ tài khoản</span><input required value={accountName} onChange={(event) => setAccountName(event.target.value.toUpperCase())} className="h-10 w-full rounded-md border px-2.5 text-sm" /></label>
        </div>
        <label className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-brand-red" /><span>Tôi đã kiểm tra số tiền và tài khoản nhận.</span></label>
        {formError ? <p className="mt-2 text-xs text-red-600">{formError}</p> : null}
        <button disabled={submitting} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-red text-sm font-semibold text-white disabled:opacity-50">
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
        </button>
      </form>
    </div>
  );
}

function TicketForm({ initialCategory, onClose, onCreated }: { initialCategory: string; onClose: () => void; onCreated: (id: string) => void }) {
  const [category, setCategory] = useState(initialCategory);
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/chat/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, orderId: orderId || null, subject, description })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Chưa thể tạo yêu cầu.");
      onCreated(data.ticket.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Chưa thể tạo yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="absolute inset-0 z-40 grid place-items-end bg-black/40 p-3 sm:place-items-center">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div><h2 className="font-semibold">Gửi yêu cầu tra soát</h2><p className="text-xs text-neutral-500">Ry chuyển thông tin này đến đội hỗ trợ.</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border"><X className="h-4 w-4" /></button>
        </div>
        <label className="mt-4 block text-sm"><span className="mb-1 block font-medium">Vấn đề cần hỗ trợ</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-md border px-3"><option value="MISSING_ORDER">Chưa ghi nhận đơn</option><option value="WRONG_CASHBACK">Sai tiền hoàn</option><option value="DELAYED">Chờ quá lâu</option><option value="REJECTED">Đơn bị từ chối</option><option value="ACCOUNT">Tài khoản</option><option value="OTHER">Vấn đề khác</option></select></label>
        <label className="mt-3 block text-sm"><span className="mb-1 block font-medium">Mã đơn (nếu có)</span><input value={orderId} onChange={(event) => setOrderId(event.target.value)} className="h-11 w-full rounded-md border px-3" /></label>
        <label className="mt-3 block text-sm"><span className="mb-1 block font-medium">Tiêu đề</span><input required minLength={5} value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 w-full rounded-md border px-3" /></label>
        <label className="mt-3 block text-sm"><span className="mb-1 block font-medium">Mô tả chi tiết</span><textarea required minLength={10} value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 w-full rounded-md border p-3" /></label>
        {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
        <button disabled={submitting} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-red font-semibold text-white disabled:opacity-50">
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>
    </div>
  );
}

function ProactiveNoticeBanner({ notice, onClose }: { notice: ProactiveNotice; onClose: () => void }) {
  return <div className="border-b border-sky-200 bg-sky-50 px-4 py-3"><div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{notice.title}</h2><p className="mt-1 text-sm text-neutral-700">{notice.message}</p>{notice.actionUrl ? <a href={notice.actionUrl} className="mt-2 inline-flex text-xs font-semibold text-brand-red">Xem chi tiết</a> : null}</div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md border bg-white"><X className="h-4 w-4" /></button></div></div>;
}

function AppNoticeBanner({ notice, secondsLeft }: { notice: AppNoticeDto | null; secondsLeft: number }) {
  if (!notice || secondsLeft <= 0) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-brand-ink">
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-amber-700 ring-1 ring-amber-200">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="break-words text-sm font-semibold [overflow-wrap:anywhere]">{notice.title}</h2>
            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">{secondsLeft}s</span>
          </div>
          <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-700 [overflow-wrap:anywhere]">{notice.message}</p>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({
  mode,
  loading,
  error,
  message,
  email,
  password,
  passwordConfirmation,
  name,
  phone,
  referralCode,
  twoFactorCode,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onNameChange,
  onPhoneChange,
  onReferralCodeChange,
  onTwoFactorCodeChange,
  onSubmit,
  appNotice,
  appNoticeSecondsLeft
  ,onBack
}: {
  mode: AuthMode;
  loading: boolean;
  error: string;
  message: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  name: string;
  phone: string;
  referralCode: string;
  twoFactorCode: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmationChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onReferralCodeChange: (value: string) => void;
  onTwoFactorCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  appNotice: AppNoticeDto | null;
  appNoticeSecondsLeft: number;
  onBack: () => void;
}) {
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isTwoFactor = mode === "2fa";
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <main className="chat-compact flex min-h-dvh flex-col bg-[#e9edf5]">
      <AppNoticeBanner notice={appNotice} secondsLeft={appNoticeSecondsLeft} />
      <button type="button" onClick={onBack} className="fixed left-4 top-4 z-20 rounded-full border border-red-100 bg-white/90 px-4 py-2 text-sm font-semibold text-brand-red shadow-sm backdrop-blur">
        ← Trang chủ
      </button>
      <section className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-soft ring-1 ring-black/5">
        <div className="mb-4 flex flex-col items-center text-center">
          <img src="/api/site-assets/logo" alt="Hoàn Tiền Mua Hàng" className="h-20 w-20 rounded-full bg-white object-cover ring-1 ring-red-100" />
          <h1 className="mt-3 text-xl font-bold text-brand-ink">Hoàn Tiền Mua Hàng</h1>
          <p className="mt-1 text-sm leading-5 text-neutral-500">Sử dụng tài khoản hệ thống hoantienmuahang.vn</p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-2.5">
          {!isTwoFactor ? (
            <label className="grid gap-1 text-sm font-semibold text-brand-ink">
              Email
              <input value={email} onChange={(event) => onEmailChange(event.target.value.toLowerCase())} type="email" autoComplete="email" required className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal lowercase outline-none focus:border-brand-red" />
            </label>
          ) : null}

          {isRegister ? (
            <>
              <label className="grid gap-1 text-sm font-semibold text-brand-ink">
                Họ tên
                <input value={name} onChange={(event) => onNameChange(event.target.value)} autoComplete="name" className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal outline-none focus:border-brand-red" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-ink">
                Số điện thoại
                <input value={phone} onChange={(event) => onPhoneChange(event.target.value)} autoComplete="tel" className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal outline-none focus:border-brand-red" />
              </label>
            </>
          ) : null}

          {!isForgot && !isTwoFactor ? (
            <label className="grid gap-1 text-sm font-semibold text-brand-ink">
              Mật khẩu
              <input value={password} onChange={(event) => onPasswordChange(event.target.value)} type="password" autoComplete={isRegister ? "new-password" : "current-password"} required className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal outline-none focus:border-brand-red" />
            </label>
          ) : null}

          {isRegister ? (
            <>
              <label className="grid gap-1 text-sm font-semibold text-brand-ink">
                Nhập lại mật khẩu
                <input value={passwordConfirmation} onChange={(event) => onPasswordConfirmationChange(event.target.value)} type="password" autoComplete="new-password" required className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal outline-none focus:border-brand-red" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-brand-ink">
                Mã giới thiệu
                <input value={referralCode} onChange={(event) => onReferralCodeChange(event.target.value)} autoComplete="off" className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal outline-none focus:border-brand-red" />
                <span className="text-xs font-normal text-neutral-500">Để trống nếu không có mã giới thiệu.</span>
              </label>
              <label className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-5 text-neutral-700 ring-1 ring-neutral-100">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required className="mt-1 h-4 w-4 shrink-0 accent-brand-red" />
                <span>
                  Tôi đã đọc và đồng ý với{" "}
                  <a href="/thong-tin/dieu-khoan-dich-vu" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-2">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="/thong-tin/chinh-sach-bao-mat" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-2">
                    Chính sách bảo mật
                  </a>
                  .
                </span>
              </label>
            </>
          ) : null}

          {isTwoFactor ? (
            <label className="grid gap-1 text-sm font-semibold text-brand-ink">
              Mã xác thực
              <input value={twoFactorCode} onChange={(event) => onTwoFactorCodeChange(event.target.value)} inputMode="numeric" required className="h-10 rounded-lg border border-red-100 px-3 text-sm font-normal outline-none focus:border-brand-red" />
            </label>
          ) : null}

          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {message ? <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

          <button type="submit" disabled={loading || (isRegister && !acceptedTerms)} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full bg-brand-red px-4 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading
              ? isForgot
                ? "Đang gửi hướng dẫn..."
                : isRegister
                  ? "Đang đăng ký..."
                  : isTwoFactor
                    ? "Đang xác thực..."
                    : "Đang đăng nhập..."
              : isForgot
                ? "Gửi hướng dẫn"
                : isRegister
                  ? "Đăng ký"
                  : isTwoFactor
                    ? "Xác thực"
                    : "Đăng nhập"}
          </button>
        </form>

        {!isTwoFactor ? (
          <div className="mt-4 grid gap-2 text-center">
            {!isRegister && !isForgot ? (
              <p className="text-sm text-neutral-600">
                Bạn chưa có tài khoản?{" "}
                <button type="button" onClick={() => onModeChange("register")} className="font-semibold text-brand-red">
                  Đăng ký ngay
                </button>
              </p>
            ) : null}
            {isRegister ? (
              <p className="text-sm text-neutral-600">
                Đã có tài khoản?{" "}
                <button type="button" onClick={() => onModeChange("login")} className="font-semibold text-brand-red">
                  Đăng nhập
                </button>
              </p>
            ) : null}
            {!isRegister ? (
              <button type="button" onClick={() => onModeChange("forgot")} className="text-xs font-medium text-neutral-500 hover:text-brand-red">
                Quên mật khẩu
              </button>
            ) : null}
          </div>
        ) : null}

        {isForgot ? (
          <button type="button" onClick={() => onModeChange("login")} className="mt-4 w-full text-center text-sm font-semibold text-brand-red">
            Quay lại đăng nhập
          </button>
        ) : null}
        </div>
      </section>
    </main>
  );
}

function DeviceNotificationModal({
  state, message, quietStart, quietEnd, categories, onQuietStart, onQuietEnd, onCategories, onEnable, onSave, onDisable, onClose
}: {
  state: "idle" | "enabling" | "enabled" | "unsupported" | "error";
  message: string;
  quietStart: string;
  quietEnd: string;
  categories: string[];
  onQuietStart: (value: string) => void;
  onQuietEnd: (value: string) => void;
  onCategories: (value: string[]) => void;
  onEnable: () => void;
  onSave: () => void;
  onDisable: () => void;
  onClose: () => void;
}) {
  const enabled = state === "enabled";
  return (
    <div className="absolute inset-0 z-[60] flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <section className="safe-bottom w-full rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Bell className="h-6 w-6" /></span>
            <div><h2 className="text-lg font-bold text-brand-ink">Thông báo thiết bị</h2><p className="text-sm text-neutral-500">{enabled ? "Thiết bị này đang nhận thông báo." : "Nhận nhắc mua hàng và cập nhật đơn."}</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100"><X className="h-5 w-5" /></button>
        </div>
        {message ? <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${enabled ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{message}</p> : null}
        {state === "unsupported" ? <p className="mt-4 text-sm text-red-700">Trình duyệt này chưa hỗ trợ thông báo đẩy. Trên iPhone, hãy cài trang vào Màn hình chính rồi mở từ biểu tượng ứng dụng.</p> : !enabled ? (
          <button type="button" onClick={onEnable} disabled={state === "enabling"} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-base font-bold text-white disabled:opacity-60">
            {state === "enabling" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}{state === "enabling" ? "Đang bật..." : "Bật thông báo"}
          </button>
        ) : (
          <div className="mt-5 grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-semibold">Yên lặng từ<input type="time" value={quietStart} onChange={(event) => onQuietStart(event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-3 text-base" /></label>
              <label className="grid gap-1 text-sm font-semibold">Đến<input type="time" value={quietEnd} onChange={(event) => onQuietEnd(event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-3 text-base" /></label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["REMINDER", "Nhắc mua hàng"], ["ORDER", "Đơn hàng"], ["CASHBACK", "Tiền hoàn"], ["SUPPORT", "Hỗ trợ"]].map(([value, label]) => (
                <label key={value} className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium">
                  <input type="checkbox" checked={categories.includes(value)} onChange={(event) => onCategories(event.target.checked ? [...categories, value] : categories.filter((item) => item !== value))} className="h-5 w-5 accent-emerald-700" />{label}
                </label>
              ))}
            </div>
            <button type="button" onClick={onSave} disabled={!categories.length} className="min-h-14 rounded-2xl bg-emerald-700 px-4 text-base font-bold text-white disabled:opacity-50">Lưu cài đặt</button>
            <button type="button" onClick={onDisable} className="min-h-12 rounded-xl border border-red-200 text-sm font-semibold text-red-700">Tắt trên thiết bị này</button>
          </div>
        )}
      </section>
    </div>
  );
}

function SideMenu({
  open,
  onClose,
  onChat,
  onCommand,
  onPage,
  pushEnabled,
  onPushSettings,
  onLogout
}: {
  open: boolean;
  onClose: () => void;
  onChat: () => void;
  onCommand: (command: string) => void;
  onPage: (slug: string) => void;
  pushEnabled: boolean;
  onPushSettings: () => void;
  onLogout: () => void;
}) {
  const [pages, setPages] = useState<PublicPageItem[]>([]);
  useEffect(() => {
    if (!open) return;
    fetch("/api/pages")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setPages(Array.isArray(data.pages) ? data.pages : []))
      .catch(() => setPages([]));
  }, [open]);

  if (!open) return null;

  const items = [
    { label: "Chat", icon: MessageCircle, action: onChat },
    { label: "Ví của tôi", icon: WalletCards, action: () => onCommand("/taikhoan") },
    { label: "Biến động ví", icon: Clock3, action: () => onCommand("/biendongsodu") },
    { label: "Đơn hàng", icon: PackageCheck, action: () => onCommand("/donhang") },
    { label: "Rút tiền", icon: HandCoins, action: () => onCommand("__withdraw__") },
    { label: "Lịch sử rút", icon: History, action: () => onCommand("/lichsurut") },
    { label: "Nhiệm vụ", icon: ListChecks, action: () => onCommand("/nhiemvu") },
    { label: "Thông báo", icon: Bell, action: () => onCommand("/thongbao") },
    { label: "Bảo mật", icon: ShieldCheck, action: () => onCommand("/baomat") },
    { label: "Phiên đăng nhập", icon: History, action: () => onCommand("/phien") },
    { label: "Giới thiệu", icon: UserRound, action: () => onCommand("/gioithieu") },
    { label: "Tra soát đơn", icon: Headphones, action: () => onCommand("__ticket__") },
    { label: "Hỗ trợ", icon: Headphones, action: () => onCommand("/hotro") },
    { label: "Xóa chat", icon: Trash2, action: () => onCommand("/xoachat") },
    { label: "Đăng xuất", icon: LogOut, action: onLogout }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-[88vw] max-w-sm flex-col bg-[#f7f8fa] shadow-soft"
        onClick={(event) => event.stopPropagation()}
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b border-red-950/10 bg-brand-red px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <img src="/api/site-assets/logo" alt="Hoàn Tiền Mua Hàng" className="h-9 w-9 rounded-full bg-white p-1 object-cover" />
            <h2 className="text-base font-semibold">Menu</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md bg-white/10" title="Đóng menu" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3">
          <button
            type="button"
            onClick={onPushSettings}
            className="col-span-2 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white"><Bell className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-brand-ink">Thông báo thiết bị</strong>
              <span className="block text-xs text-neutral-500">{pushEnabled ? "Đang bật · Chạm để cài đặt" : "Chưa bật · Chạm để thiết lập"}</span>
            </span>
            <span className={`h-2.5 w-2.5 rounded-full ${pushEnabled ? "bg-emerald-500" : "bg-neutral-300"}`} />
          </button>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex min-h-14 w-full items-center gap-2.5 rounded-xl border border-brand-line bg-white px-3 text-left text-[13px] font-semibold text-brand-ink shadow-sm hover:bg-[#f1f7f4]"
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-red" />
                <span>{item.label}</span>
              </button>
            );
          })}
          {pages.length ? (
            <div className="col-span-2 mt-2 border-t border-brand-line pt-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">Thông tin & chính sách</p>
              <div className="grid gap-1">
                {pages.map((page) => (
                  <button key={page.slug} type="button" onClick={() => onPage(page.slug)} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] font-medium text-brand-ink hover:bg-[#f1f7f4]">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#8a6c35]" />
                    <span className="truncate">{page.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
    <div className={`mb-3 flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? <BotAvatar /> : null}
      <div className={isUser ? "flex min-w-0 max-w-[86%] justify-end overflow-hidden" : "min-w-0 w-[calc(100%-44px)] max-w-[calc(100%-44px)] overflow-hidden sm:w-full sm:max-w-lg"}>
        {cashback ? (
          <CashbackCard data={cashback} />
        ) : loginError ? (
          <LoginErrorCard data={loginError} onSend={onSend} />
        ) : (
          isUser ? (
            <div className="chat-text whitespace-pre-line rounded-2xl rounded-br-md border border-sky-200 bg-sky-100 px-4 py-3 text-[15px] leading-6 text-brand-ink shadow-sm">{message.content}</div>
          ) : (
            <BotCard content={message.content} onSend={onSend} />
          )
        )}
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
      <img src="/api/site-assets/avatar" alt="Em Ry - Trợ lý hoàn tiền" className="h-full w-full object-cover p-0.5" />
    </span>
  );
}

function BotCard({ content, onSend }: { content: string; onSend: (message: string) => void }) {
  if (content.startsWith("STATIC_PAGE:")) {
    let slug = "";
    try { slug = String((JSON.parse(content.slice("STATIC_PAGE:".length)) as { slug?: string }).slug ?? ""); } catch {}
    return <button type="button" onClick={() => onSend(`__page__:${slug}`)} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#d9dde3] bg-white px-3 text-xs font-semibold text-brand-ink"><BookOpen className="h-4 w-4 text-[#8a6c35]" /> Xem nội dung chính sách</button>;
  }
  if (content.startsWith("TICKET_FORM:")) {
    let category = "MISSING_ORDER";
    try { category = String((JSON.parse(content.slice("TICKET_FORM:".length)) as { category?: string }).category ?? category); } catch {}
    return <button type="button" onClick={() => onSend(`__ticket__:${category}`)} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-3 text-xs font-semibold text-white"><Headphones className="h-4 w-4" /> Mở form tra soát đơn</button>;
  }
  if (content.startsWith("WITHDRAWAL_FORM:")) {
    let amount = "";
    try { amount = String((JSON.parse(content.slice("WITHDRAWAL_FORM:".length)) as { amount?: number }).amount ?? ""); } catch {}
    return <button type="button" onClick={() => onSend(`__withdraw__:${amount}`)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white"><WalletCards className="h-4 w-4" /> Mở form rút tiền</button>;
  }
  if (isAuthStartMessage(content)) return <AuthChoiceCard onSend={onSend} />;
  if (content.includes("Bạn muốn Ry xóa phần nào")) return <DeleteChoiceCard onSend={onSend} />;
  if (content.includes("Bạn kiểm tra lại thông tin rút tiền")) return <WithdrawalConfirmationCard content={content} onSend={onSend} />;
  if (content.includes("Bạn đang yêu cầu xóa tài khoản")) return <AccountDeleteConfirmationCard onSend={onSend} />;
  if (content.includes("đăng xuất tài khoản khỏi tất cả thiết bị khác")) return <RevokeSessionsConfirmationCard onSend={onSend} />;

  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const title = lines[0] ?? "Thông báo";
  const body = lines.slice(1);

  if (!body.length) return <SimpleBotCard content={title} />;

  return (
    <div className="chat-text w-full min-w-0 overflow-hidden rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 text-brand-ink shadow-sm">
      <h2 className="mb-2 text-sm font-semibold leading-5">{title.replace(/:$/, "")}</h2>
      <div className="min-w-0 text-sm leading-relaxed">
        {isAccountTitle(title) ? (
          <AccountSummary lines={body} />
        ) : isBalanceActivityTitle(title) ? (
          <BalanceActivity lines={body} />
        ) : isSecurityTitle(title) ? (
          <SecuritySummary lines={body} onSend={onSend} />
        ) : isSessionsTitle(title) ? (
          <SessionSummary lines={body} onSend={onSend} />
        ) : isActivityTitle(title) ? (
          <ActivityTimeline lines={body} />
        ) : isSmartGuideTitle(title) ? (
          <SmartGuide lines={body} onSend={onSend} />
        ) : isWithdrawalHistoryTitle(title) ? (
          <WithdrawalHistory lines={body} onSend={onSend} />
        ) : isTaskTitle(title) ? (
          <TaskList lines={body} onSend={onSend} />
        ) : isNotificationTitle(title) ? (
          <NotificationList lines={body} onSend={onSend} />
        ) : isReferralTitle(title) ? (
          <ReferralSummary lines={body} />
        ) : isOrderTitle(title) ? (
          <OrderList lines={body} onSend={onSend} />
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

function BalanceActivity({ lines }: { lines: string[] }) {
  const groups: string[][] = [];
  lines.forEach((line) => {
    if (/^\d+\./.test(line) || !groups.length) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });
  return <div className="grid gap-2.5">{groups.map((group, index) => {
    const title = group[0]?.replace(/^\d+\.\s*/, "") || "Giao dịch";
    const amount = group.find((line) => line.toLowerCase().startsWith("số tiền:"))?.split(":").slice(1).join(":").trim() || "-";
    const balance = group.find((line) => line.toLowerCase().startsWith("số dư sau giao dịch:"))?.split(":").slice(1).join(":").trim() || "-";
    const credit = amount.trim().startsWith("+");
    return <article key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${credit ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><WalletCards className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-5">{title}</h3><div className="mt-1.5 flex flex-wrap items-center justify-between gap-2"><strong className={`text-base ${credit ? "text-emerald-700" : "text-red-700"}`}>{amount}</strong><span className="text-xs text-neutral-500">Còn {balance}</span></div></div>
      </div>
    </article>;
  })}</div>;
}

function SecuritySummary({ lines, onSend }: { lines: string[]; onSend: (message: string) => void }) {
  const entries = lines.filter((line) => line.includes(":"));
  return <div className="grid gap-3">
    {entries.map((line) => {
      const [label, ...rest] = line.split(":"); const status = rest.join(":").trim(); const active = status.toLowerCase().includes("đang bật");
      return <div key={line} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 px-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><ShieldCheck className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><span className="text-xs text-neutral-500">{status}</span></span><span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-400"}`} /></div>;
    })}
    <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-neutral-600">Để thay đổi 2FA hoặc OTP email, hãy mở phần bảo mật trên tài khoản Hoàn Tiền Mua Hàng.</p>
    <button type="button" onClick={() => onSend("/phien")} className="min-h-12 rounded-xl border border-brand-red bg-red-50 text-sm font-semibold text-brand-red">Kiểm tra phiên đăng nhập</button>
  </div>;
}

function SessionSummary({ lines, onSend }: { lines: string[]; onSend: (message: string) => void }) {
  const groups: string[][] = [];
  lines.filter((line) => !line.startsWith("Bạn có thể")).forEach((line) => {
    if (/^\d+\./.test(line) || !groups.length) groups.push([line]); else groups[groups.length - 1].push(line);
  });
  return <div className="grid gap-2.5">{groups.map((group, index) => {
    const device = group[0]?.replace(/^\d+\.\s*/, "") || "Thiết bị";
    const id = group.find((line) => line.startsWith("ID:"))?.slice(3).trim() || "";
    const current = device.includes("(hiện tại)");
    return <article key={`${id}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${current ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><ShieldCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{device}</h3>{group.slice(2).map((line) => <p key={line} className="mt-1 text-xs text-neutral-500">{line}</p>)}</div></div>{!current && id && id !== "-" ? <button type="button" onClick={() => onSend(`/phien revoke ${id}`)} className="mt-3 min-h-11 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700">Đăng xuất thiết bị này</button> : null}</article>;
  })}<button type="button" onClick={() => onSend("/phien revoke-others")} className="min-h-12 rounded-xl bg-brand-red px-3 text-sm font-semibold text-white">Đăng xuất tất cả thiết bị khác</button></div>;
}

function ActivityTimeline({ lines }: { lines: string[] }) {
  const groups: string[][] = [];
  lines.forEach((line) => {
    if (/^\d+\./.test(line) || !groups.length) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });
  const field = (group: string[], label: string) => group.find((line) => line.toLowerCase().startsWith(`${label}:`))?.split(":").slice(1).join(":").trim() || "-";
  return (
    <div className="relative grid gap-0">
      {groups.map((group, index) => {
        const activity = group[0]?.replace(/^\d+\.\s*/, "") || "Hoạt động tài khoản";
        const device = field(group, "thiết bị");
        return (
          <article key={`${activity}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
            {index < groups.length - 1 ? <span className="absolute bottom-0 left-[19px] top-10 w-px bg-slate-200" /> : null}
            <span className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-white bg-slate-100 text-brand-red shadow-sm"><Clock3 className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="text-sm font-semibold leading-5 text-brand-ink">{activity}</h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500"><Clock3 className="h-3.5 w-3.5 shrink-0" />{field(group, "thời gian")}</p>
              <p className="mt-1 text-xs text-neutral-500">IP: <span className="font-medium text-brand-ink">{field(group, "ip")}</span></p>
              <p className="mt-1 line-clamp-2 break-all text-xs leading-5 text-neutral-500">Thiết bị: <span className="text-brand-ink">{device}</span></p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SmartGuide({ lines, onSend }: { lines: string[]; onSend: (message: string) => void }) {
  const steps = lines.filter((line) => line.startsWith("STEP:")).map((line) => {
    const [number, title, description] = line.slice(5).split("|");
    return { number, title, description };
  });
  const suggestions = lines.filter((line) => line.startsWith("SUGGEST:")).map((line) => {
    const [label, command] = line.slice(8).split("|");
    return { label, command };
  });
  const tip = lines.find((line) => line.startsWith("TIP:"))?.slice(4);
  return (
    <div className="grid gap-4">
      <div className="grid gap-2.5">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-red text-sm font-bold text-white">{step.number}</span>
            <div><h3 className="text-sm font-bold text-brand-ink">{step.title}</h3><p className="mt-1 text-[13px] leading-5 text-neutral-600">{step.description}</p></div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold text-brand-ink">Thử hỏi Ry</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button key={suggestion.label} type="button" onClick={() => onSend(suggestion.command)} className="min-h-11 rounded-full border border-red-100 bg-red-50 px-3 text-left text-[13px] font-semibold text-brand-red">
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
      {tip ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[13px] leading-5 text-amber-900"><strong>Mẹo ghi nhận đơn:</strong> {tip}</div> : null}
      <p className="text-center text-xs leading-5 text-neutral-500">Không cần nhớ lệnh — cứ nhắn điều bạn muốn, Ry sẽ tự hiểu.</p>
    </div>
  );
}

function ReferralSummary({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);
  const value = (label: string) => lines.find((line) => line.toLowerCase().startsWith(`${label}:`))?.split(":").slice(1).join(":").trim() || "-";
  const referralCode = value("mã giới thiệu");
  const referralLink = value("link giới thiệu");
  const f1 = value("thành viên f1");
  const f2 = value("thành viên f2");
  const commission = value("tổng hoa hồng");
  const policy = lines.find((line) => line.toLowerCase().startsWith("chính sách hiện tại"));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_6px_18px_rgba(48,52,59,0.055)]">
      <div className="bg-gradient-to-br from-[#f1f7f4] to-[#fafaf8] p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#287a63] text-white"><UserRound className="h-4 w-4" /></span>
          <div className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.08em] text-neutral-500">Mã giới thiệu của bạn</span>
            <strong className="mt-0.5 block break-words text-sm font-semibold tracking-wide text-brand-ink">{referralCode}</strong>
          </div>
        </div>
        <div className="mt-2.5 flex min-w-0 items-center gap-2 rounded-lg border border-[#d9dde3] bg-white p-1.5">
          <span className="min-w-0 flex-1 truncate pl-1 text-[10px] text-neutral-500">{referralLink}</span>
          <button type="button" onClick={copyLink} disabled={!referralLink || referralLink === "-"} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-[#287a63] px-2 text-[10px] font-semibold text-white disabled:opacity-40">
            {copied ? <CheckCircle2 className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
            {copied ? "Đã sao chép" : "Sao chép link"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#e7e9ed] border-t border-[#e7e9ed]">
        <div className="px-2 py-2.5 text-center"><span className="block text-[10px] text-neutral-500">Thành viên F1</span><strong className="mt-0.5 block text-sm text-brand-ink">{f1}</strong></div>
        <div className="px-2 py-2.5 text-center"><span className="block text-[10px] text-neutral-500">Thành viên F2</span><strong className="mt-0.5 block text-sm text-brand-ink">{f2}</strong></div>
        <div className="px-2 py-2.5 text-center"><span className="block text-[10px] text-neutral-500">Hoa hồng</span><strong className="mt-0.5 block break-words text-xs text-[#287a63]">{commission}</strong></div>
      </div>
      {policy ? <p className="border-t border-[#e7e9ed] bg-[#faf8f2] px-3 py-2 text-[10px] leading-4 text-neutral-500">{policy}</p> : null}
    </div>
  );
}

function TaskList({ lines, onSend }: { lines: string[]; onSend: (message: string) => void }) {
  const groups: string[][] = [];
  lines.forEach((line) => {
    if (/^\d+\./.test(line) || groups.length === 0) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });

  return (
    <div className="grid gap-2.5">
      {groups.map((group, index) => {
        const name = group[0]?.replace(/^\d+\.\s*/, "") || `Nhiệm vụ ${index + 1}`;
        const value = (label: string) => group.find((line) => line.toLowerCase().startsWith(`${label}:`))?.split(":").slice(1).join(":").trim() || "";
        const id = value("id");
        const description = value("mô tả");
        const guide = value("hướng dẫn");
        const taskType = value("loại nhiệm vụ");
        const actionLabel = value("cần thực hiện");
        const startAt = value("bắt đầu");
        const endAt = value("kết thúc");
        const progressText = value("tiến độ");
        const reward = value("thưởng");
        const statusText = value("trạng thái");
        const percentMatch = progressText.match(/\(([\d.]+)%\)/);
        const progressNumbers = progressText.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        const calculatedPercent = progressNumbers && Number(progressNumbers[2]) > 0 ? (Number(progressNumbers[1]) / Number(progressNumbers[2])) * 100 : 0;
        const percent = Math.max(0, Math.min(100, Number(percentMatch?.[1] ?? calculatedPercent)));
        const status = normalizeStatus(statusText);
        const claimable = (percent >= 100 || /(completed|ready|claimable|hoàn thành|đủ điều kiện)/i.test(statusText)) && !/(đã nhận|claimed|paid)/i.test(statusText);

        return (
          <article key={`${id}-${index}`} className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_5px_16px_rgba(48,52,59,0.055)]">
            <div className="p-3">
              <div className="flex items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f7f4ed] text-[#8a6c35]"><ListChecks className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-brand-ink">{name}</h3>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-neutral-500"><span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />{status.label}</span>
                  </div>
                  {description ? <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-neutral-500">{description}</p> : null}
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[9px]">
                    {taskType && taskType !== "-" ? <span className="rounded-full bg-[#f7f4ed] px-2 py-0.5 text-[#8a6c35]">{taskType}</span> : null}
                    {actionLabel && actionLabel !== "-" ? <span className="rounded-full bg-[#f1f7f4] px-2 py-0.5 text-[#287a63]">{actionLabel}</span> : null}
                  </div>
                </div>
              </div>
              {guide ? (
                <div className="mt-2 rounded-lg border-l-2 border-[#c6a76a] bg-[#faf8f2] px-2.5 py-2">
                  <span className="block text-[10px] font-semibold text-[#8a6c35]">Hướng dẫn thực hiện</span>
                  <p className="mt-0.5 text-[11px] leading-4 text-neutral-600">{guide}</p>
                </div>
              ) : null}
              {startAt || endAt ? <p className="mt-1.5 text-[9px] text-neutral-400">{startAt ? `Từ ${startAt}` : ""}{startAt && endAt ? " · " : ""}{endAt ? `Đến ${endAt}` : ""}</p> : null}
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between text-[10px]"><span className="text-neutral-500">{progressText}</span><strong className="font-semibold text-[#8a6c35]">{reward}</strong></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e9ecef]"><span className="block h-full rounded-full bg-[#287a63] transition-all" style={{ width: `${percent}%` }} /></div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-[#e7e9ed] bg-[#fafaf8] px-3 py-2">
              <button type="button" onClick={() => onSend(`/nhiemvu sync ${id}`)} className="h-7 flex-1 rounded-md border border-brand-line bg-white text-[10px] font-medium text-brand-ink">Cập nhật tiến độ</button>
              <button type="button" disabled={!claimable} onClick={() => onSend(`/nhiemvu claim ${id}`)} className="h-7 flex-1 rounded-md bg-[#287a63] text-[10px] font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500">
                {claimable ? "Nhận thưởng" : "Chưa đủ điều kiện"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function NotificationList({ lines, onSend }: { lines: string[]; onSend: (message: string) => void }) {
  const showActions = lines.includes("NOTIFICATION_ACTIONS:READ_ALL");
  const contentLines = lines.filter((line) => !line.startsWith("NOTIFICATION_ACTIONS:"));
  const groups: string[][] = [];
  contentLines.forEach((line) => {
    if (/^\d+\./.test(line) || groups.length === 0) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });

  return (
    <div className="grid gap-2">
      {groups.map((group, index) => {
        const title = group[0]?.replace(/^\d+\.\s*/, "") || "Thông báo";
        const value = (label: string) => group.find((line) => line.toLowerCase().startsWith(`${label}:`))?.split(":").slice(1).join(":").trim() || "";
        const id = value("id");
        const readStatus = value("trạng thái đọc");
        return (
          <article key={`${title}-${index}`} className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_4px_14px_rgba(48,52,59,0.045)]">
            <div className="p-2.5">
            <div className="flex items-start gap-2.5">
              <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f1f7f4] text-[#287a63]"><Bell className="h-4 w-4" /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#c6a76a]" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold leading-4 text-brand-ink">{title}</h3>
                <div className="mt-1.5 rounded-lg bg-[#f6f7f8] px-2.5 py-2">
                  <span className="block text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-400">Chi tiết</span>
                  <p className="mt-0.5 whitespace-pre-line text-[11px] leading-4 text-neutral-600">{value("nội dung")}</p>
                </div>
                <div className="mt-1.5 flex flex-wrap justify-between gap-1.5 text-[10px] text-neutral-400">
                  <span>{value("loại")} · #{id}</span>
                  <span>{value("thời gian")}</span>
                </div>
              </div>
            </div>
            </div>
            {readStatus !== "Đã đọc" && id ? (
              <button type="button" onClick={() => onSend(`/thongbao read ${id}`)} className="h-7 w-full border-t border-[#e7e9ed] bg-[#fafaf8] text-[10px] font-medium text-brand-red">Đánh dấu đã đọc</button>
            ) : null}
          </article>
        );
      })}
      {showActions ? <button type="button" onClick={() => onSend("/doctatca")} className="h-8 w-full rounded-md border border-[#cfe1da] bg-[#f1f7f4] text-[11px] font-semibold text-brand-red">Đánh dấu tất cả đã đọc</button> : null}
    </div>
  );
}

function WithdrawalHistory({ lines, onSend }: { lines: string[]; onSend?: (message: string) => void }) {
  const navigationLine = lines.find((line) => line.startsWith("WITHDRAWAL_NAV:"));
  let navigation: { mode: string; currentPage: number; lastPage: number; total: number } | null = null;
  try {
    navigation = navigationLine ? JSON.parse(navigationLine.slice("WITHDRAWAL_NAV:".length)) : null;
  } catch {}
  const historyLines = lines.filter((line) => !line.startsWith("WITHDRAWAL_NAV:"));
  const groups: string[][] = [];
  historyLines.forEach((line) => {
    if (/^\d+\./.test(line) || groups.length === 0) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });

  return (
    <div className="grid gap-2.5">
      {groups.map((group, index) => {
        const amount = group[0]?.replace(/^\d+\.\s*/, "") || "0 VND";
        const code = group.find((line) => line.toLowerCase().startsWith("mã yêu cầu:"))?.split(":").slice(1).join(":").trim() || "-";
        const bank = group.find((line) => line.toLowerCase().startsWith("ngân hàng:"))?.split(":").slice(1).join(":").trim() || "-";
        const received = group.find((line) => line.toLowerCase().startsWith("thực nhận:"))?.split(":").slice(1).join(":").trim() || amount;
        const createdAt = group.find((line) => line.toLowerCase().startsWith("ngày tạo:"))?.split(":").slice(1).join(":").trim() || "Chưa có";
        const notes = group.find((line) => line.toLowerCase().startsWith("ghi chú:"))?.split(":").slice(1).join(":").trim();
        const statusLine = group.find((line) => line.toLowerCase().startsWith("trạng thái:"));
        const status = normalizeStatus(statusLine?.split(":").slice(1).join(":") ?? "");

        return (
          <article key={`${amount}-${index}`} className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_5px_16px_rgba(48,52,59,0.055)]">
            <div className="flex items-start gap-2.5 p-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f1f7f4] text-[#287a63]">
                <HandCoins className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.08em] text-neutral-500">Số tiền rút</span>
                    <strong className="mt-0.5 block break-words text-sm font-semibold text-brand-ink [overflow-wrap:anywhere]">{amount}</strong>
                    <span className="mt-0.5 block text-[10px] text-neutral-500">Thực nhận <strong className="font-semibold text-[#287a63]">{received}</strong></span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-[11px] font-medium text-neutral-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
                    {status.label}
                  </span>
                </div>
                <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-[#e7e9ed] pt-2 text-[10px] leading-4">
                  <span className="min-w-0 truncate text-brand-ink">{bank}</span>
                  <span className="shrink-0 text-neutral-500">{createdAt}</span>
                </div>
                <span className="mt-0.5 block text-[9px] text-neutral-400">#{code}</span>
                {notes ? <p className="mt-2 rounded-md bg-[#f7f4ed] px-2 py-1.5 text-[11px] leading-4 text-neutral-600"><strong className="font-medium text-brand-ink">Ghi chú:</strong> {notes}</p> : null}
              </div>
            </div>
          </article>
        );
      })}
      {navigation?.mode === "summary" && onSend ? (
        <button type="button" onClick={() => onSend("/lichsurut all page=1")} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[#cfe1da] bg-[#f1f7f4] px-2.5 text-[11px] font-semibold text-brand-red">
          <History className="h-3.5 w-3.5" />
          Xem toàn bộ lịch sử
        </button>
      ) : null}
      {navigation?.mode === "full" && onSend ? (
        <div className="flex items-center justify-between gap-2">
          <button type="button" disabled={navigation.currentPage <= 1} onClick={() => onSend(`/lichsurut all page=${navigation.currentPage - 1}`)} className="h-8 rounded-md border border-brand-line bg-white px-2.5 text-[11px] font-medium text-brand-ink disabled:opacity-40">Trang trước</button>
          <span className="text-[10px] text-neutral-500">Trang {navigation.currentPage}/{Math.max(1, navigation.lastPage)} · {navigation.total} lần rút</span>
          <button type="button" disabled={navigation.currentPage >= navigation.lastPage} onClick={() => onSend(`/lichsurut all page=${navigation.currentPage + 1}`)} className="h-8 rounded-md border border-brand-line bg-white px-2.5 text-[11px] font-medium text-brand-ink disabled:opacity-40">Trang sau</button>
        </div>
      ) : null}
    </div>
  );
}

function AccountSummary({ lines }: { lines: string[] }) {
  const values = new Map(
    lines.map((line) => {
      const item = splitLabelValue(line);
      return item ? [item.label.toLowerCase(), item.value] : ["", line];
    })
  );
  const balance = values.get("số dư ví") ?? "0 VND";
  const email = values.get("email") ?? "-";
  const name = values.get("họ tên") ?? "-";
  const approvedOrders = values.get("đơn đã duyệt") ?? "0";
  const referrals = values.get("người giới thiệu") ?? "0";

  return (
    <div className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_8px_24px_rgba(48,52,59,0.06)]">
      <div className="bg-gradient-to-br from-[#f1f7f4] to-[#fafaf8] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#287a63] text-white shadow-sm">
              <WalletCards className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">Số dư khả dụng</span>
              <strong className="mt-0.5 block break-words text-lg font-semibold leading-6 tracking-tight text-[#287a63] [overflow-wrap:anywhere]">{balance}</strong>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-100 bg-white/80 px-2 py-1 text-[10px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đã cập nhật
          </span>
        </div>
      </div>
      <div className="border-t border-[#e7e9ed] px-3 py-2.5">
        <div className="grid gap-1.5 text-xs leading-5">
          <div className="flex min-w-0 justify-between gap-3">
            <span className="shrink-0 text-neutral-500">Họ tên</span>
            <span className="min-w-0 break-words text-right font-medium text-brand-ink [overflow-wrap:anywhere]">{name}</span>
          </div>
          <div className="flex min-w-0 justify-between gap-3">
            <span className="shrink-0 text-neutral-500">Email</span>
            <span className="min-w-0 break-words text-right text-brand-ink [overflow-wrap:anywhere]">{email}</span>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[#e7e9ed] pt-2.5">
          <div className="rounded-lg bg-[#f6f7f8] px-2.5 py-2">
            <span className="block text-[11px] text-neutral-500">Đơn đã duyệt</span>
            <strong className="mt-0.5 block text-sm font-semibold text-brand-ink">{approvedOrders}</strong>
          </div>
          <div className="rounded-lg bg-[#f7f4ed] px-2.5 py-2">
            <span className="block text-[11px] text-neutral-500">Người giới thiệu</span>
            <strong className="mt-0.5 block text-sm font-semibold text-[#8a6c35]">{referrals}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function WithdrawalConfirmationCard({ content, onSend }: { content: string; onSend: (message: string) => void }) {
  const details = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(Số tiền|Ngân hàng|Số tài khoản|Chủ tài khoản):/i.test(line));

  return (
    <div className="chat-text w-full overflow-hidden rounded-2xl rounded-bl-md border border-amber-200 bg-white p-3 text-brand-ink shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700">
          <WalletCards className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Xác nhận thông tin rút tiền</h2>
          <p className="text-xs text-neutral-600">Bạn kiểm tra kỹ trước khi gửi yêu cầu nhé.</p>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5 rounded-lg bg-neutral-50 p-3 text-sm">
        {details.map((line) => <BotCardLine key={line} line={line} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onSend("1")} className="h-11 rounded-md bg-brand-red px-3 text-sm font-semibold text-white">
          Gửi yêu cầu
        </button>
        <button type="button" onClick={() => onSend("2")} className="h-11 rounded-md border border-brand-line px-3 text-sm font-semibold text-neutral-700">
          Hủy
        </button>
      </div>
    </div>
  );
}

function AccountDeleteConfirmationCard({ onSend }: { onSend: (message: string) => void }) {
  return (
    <div className="chat-text w-full overflow-hidden rounded-2xl rounded-bl-md border border-red-200 bg-white p-3 text-brand-ink shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-red-100 text-red-700">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Xác nhận xóa tài khoản</h2>
          <p className="text-xs text-neutral-600">Dữ liệu có thể không khôi phục được sau khi xóa.</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={() => onSend("/xacnhan-xoataikhoan")} className="h-11 rounded-md bg-red-600 px-3 text-sm font-semibold text-white">
          Tôi chắc chắn muốn xóa
        </button>
        <button type="button" onClick={() => onSend("/huy")} className="h-11 rounded-md border border-brand-line px-3 text-sm font-semibold text-neutral-700">
          Giữ tài khoản
        </button>
      </div>
    </div>
  );
}

function RevokeSessionsConfirmationCard({ onSend }: { onSend: (message: string) => void }) {
  return (
    <div className="chat-text w-full overflow-hidden rounded-2xl rounded-bl-md border border-amber-200 bg-white p-3 text-brand-ink shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Đăng xuất các thiết bị khác?</h2>
          <p className="text-xs text-neutral-600">Thiết bị hiện tại của bạn vẫn được giữ đăng nhập.</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onSend("đồng ý")} className="h-11 rounded-md bg-brand-red px-3 text-sm font-semibold text-white">Đăng xuất</button>
        <button type="button" onClick={() => onSend("không")} className="h-11 rounded-md border border-brand-line px-3 text-sm font-semibold text-neutral-700">Hủy</button>
      </div>
    </div>
  );
}

function DeleteChoiceCard({ onSend }: { onSend: (message: string) => void }) {
  return (
    <div className="chat-text w-full overflow-hidden rounded-2xl rounded-bl-md border border-amber-200 bg-white p-3 text-brand-ink shadow-sm">
      <h2 className="text-sm font-semibold">Bạn muốn Ry xóa phần nào?</h2>
      <p className="mt-1 text-xs text-neutral-600">Ry cần bạn chọn rõ để tránh xóa nhầm dữ liệu.</p>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={() => onSend("xóa chat")} className="h-10 rounded-md bg-brand-red px-3 text-sm font-semibold text-white">Xóa cuộc trò chuyện</button>
        <button type="button" onClick={() => onSend("xóa tài khoản")} className="h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700">Xóa tài khoản</button>
        <button type="button" onClick={() => onSend("không xóa nữa")} className="h-10 rounded-md border border-brand-line px-3 text-sm font-semibold text-neutral-700">Không xóa gì cả</button>
      </div>
    </div>
  );
}

function SimpleBotCard({ content }: { content: string }) {
  return (
    <div className="chat-text min-w-0 overflow-hidden rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 shadow-sm">
      <HighlightedLine line={content} />
    </div>
  );
}

function AuthChoiceCard({ onSend }: { onSend: (message: string) => void }) {
  return (
    <div className="chat-text w-full overflow-hidden rounded-2xl rounded-bl-md border border-red-100 bg-white text-brand-ink shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-red-100 bg-gradient-to-r from-red-50 to-amber-50 px-3 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-red text-white">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Chào bạn, em là Ry 👋</h2>
          <p className="mt-0.5 text-xs text-neutral-600">Ry sẽ giúp bạn tạo link và theo dõi tiền hoàn thật dễ dàng.</p>
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
    <div className="chat-text w-full overflow-hidden rounded-2xl rounded-bl-md border border-amber-200 bg-white text-brand-ink shadow-sm">
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

function OrderList({ lines, onSend }: { lines: string[]; onSend: (message: string) => void }) {
  const scopeLine = lines.find((line) => line.startsWith("ORDER_SCOPE:"));
  const orderLines = lines.filter((line) => !line.startsWith("ORDER_SCOPE:"));
  const groups: string[][] = [];
  orderLines.forEach((line) => {
    if (/^\d+\./.test(line) || groups.length === 0) groups.push([line]);
    else groups[groups.length - 1].push(line);
  });

  return (
    <div className="grid gap-2.5">
      {groups.map((group, index) => {
        const name = group[0]?.replace(/^\d+\.\s*/, "") || `Đơn hàng ${index + 1}`;
        const cashback = group.find((line) => line.toLowerCase().startsWith("tiền hoàn dự kiến"));
        const statusLine = group.find((line) => line.toLowerCase().startsWith("trạng thái"));
        const image = group.find((line) => line.toLowerCase().startsWith("ảnh sản phẩm:"))?.split(":").slice(1).join(":").trim();
        const reconciliation = group.find((line) => line.toLowerCase().startsWith("ngày đối soát:"))?.split(":").slice(1).join(":").trim();
        const status = normalizeStatus(statusLine?.split(":").slice(1).join(":") ?? "");

        return (
          <article key={`${name}-${index}`} className="overflow-hidden rounded-xl border border-[#d9dde3] bg-white shadow-[0_5px_16px_rgba(48,52,59,0.055)]">
            <div className="p-2.5">
            <div className="flex items-start gap-2.5">
              <div className="relative shrink-0">
                {image && image !== "-" ? (
                  <img src={image} alt="" className="h-14 w-14 rounded-lg border border-neutral-100 object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#f1f7f4] text-brand-red"><PackageCheck className="h-5 w-5" /></span>
                )}
                <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#30343b] px-1 text-[9px] font-semibold text-white shadow-sm">{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words text-[11px] font-normal leading-4 text-brand-ink [overflow-wrap:anywhere]">{name}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-neutral-500">
                  <Clock3 className="h-3 w-3" />
                  Đối soát: {reconciliation || "Chưa có"}
                </p>
              </div>
            </div>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 border-t border-[#e7e9ed] bg-[#fafaf8] px-2.5 py-2 text-[11px]">
              <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-neutral-600">
                <span className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
                {status.label}
              </span>
              {cashback ? (
                <span className="min-w-0 break-words text-right [overflow-wrap:anywhere]">
                  <span className="text-neutral-500">Hoàn dự kiến </span>
                  <strong className="font-semibold text-brand-red">{cashback.split(":").slice(1).join(":").trim()}</strong>
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
      {scopeLine ? (
        <button type="button" onClick={() => onSend(scopeLine.endsWith("ALL") ? "/donhang all" : "/donhang")} className="inline-flex h-8 w-full items-center justify-center rounded-md border border-[#cfe1da] bg-[#f1f7f4] px-2.5 text-[11px] font-semibold text-brand-red">
          {scopeLine.endsWith("ALL") ? "Kiểm tra toàn bộ đơn hàng" : "Chỉ xem đơn trong 10 ngày"}
        </button>
      ) : null}
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
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="flex min-w-0 items-center gap-2 rounded-md border border-red-100 px-3 py-2 hover:bg-red-50">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-red-50 text-brand-red">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-neutral-500">{label}</span>
        <span className="block break-words text-sm font-semibold text-brand-ink [overflow-wrap:anywhere]">{value}</span>
      </span>
    </a>
  );
}

function HighlightedLine({ line }: { line: string }) {
  const tone = getLineStatusTone(line);
  const parts = splitLabelValue(line);

  return (
    <p className="flex min-w-0 items-start gap-2 py-0.5 text-neutral-700">
      {tone ? <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${tone}`} /> : null}
      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
        {parts ? (
          <>
            <strong className="font-semibold text-brand-ink">{parts.label}: </strong>
            <span>{parts.value}</span>
          </>
        ) : (
          <span>{line}</span>
        )}
      </span>
    </p>
  );
}

function BotCardLine({ line }: { line: string }) {
  const statusMatch = line.match(/^(Trạng thái|Trạng thái đơn|Tình trạng):\s*(.+)$/i);
  if (statusMatch) {
    const status = normalizeStatus(statusMatch[2]);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{statusMatch[1]}:</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${status.className}`}>
          <span className={`h-2 w-2 rounded-full ${status.dotClassName}`} />
          {status.label}
        </span>
      </div>
    );
  }

  const moneyMatch = line.match(/^(Số dư ví|Hoàn tiền|Số tiền|Hoa hồng|Tiền hoàn|Tiền hoàn dự kiến|Đơn đã duyệt|Người giới thiệu):\s*(.+)$/i);
  if (moneyMatch) {
    return (
      <p className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-0.5">
        <strong className="shrink-0 font-semibold text-brand-ink">{moneyMatch[1]}:</strong>
        <span className="min-w-0 break-words text-right font-semibold text-brand-red [overflow-wrap:anywhere]">{moneyMatch[2]}</span>
      </p>
    );
  }

  const bankMatch = line.match(/^(Ngân hàng|Số tài khoản|Chủ tài khoản|Phương thức|Email|Họ tên):\s*(.+)$/i);
  if (bankMatch) {
    return (
      <p className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-0.5">
        <strong className="shrink-0 font-semibold text-brand-ink">{bankMatch[1]}:</strong>
        <span className="min-w-0 break-words text-right text-neutral-700 [overflow-wrap:anywhere]">{bankMatch[2]}</span>
      </p>
    );
  }

  if (/^https?:\/\//i.test(line) || line.includes("/ruttien")) {
    return (
      <a href={line.startsWith("http") ? line : undefined} target={line.startsWith("http") ? "_blank" : undefined} rel={line.startsWith("http") ? "noreferrer" : undefined} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-brand-red ring-1 ring-red-100">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">{line.startsWith("http") ? "Mở liên kết" : line}</span>
      </a>
    );
  }

  if (/^[-•]|\d+\./.test(line)) {
    return (
      <div className="flex min-w-0 items-start gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{line.replace(/^[-•]\s*/, "")}</span>
      </div>
    );
  }

  if (line.toLowerCase().includes("không chịu trách nhiệm")) {
    return (
      <div className="rounded-md bg-amber-50 px-2.5 py-1.5 text-amber-800">
        <span className="break-words [overflow-wrap:anywhere]">{line}</span>
      </div>
    );
  }

  return <HighlightedLine line={line} />;
}

function CashbackCard({ data }: { data: CashbackCardData }) {
  const platformLabel = data.platform === "tiktok" ? "Tiktok" : data.platform === "shopee" ? "Shoppe" : "sàn";
  return (
    <div className="chat-text w-full min-w-0 overflow-hidden rounded-2xl rounded-bl-md border border-black/5 bg-white p-3 text-brand-ink shadow-sm">
      <div className="flex items-start gap-2.5">
        {data.productImage ? <img src={data.productImage} alt="" className="h-14 w-14 shrink-0 rounded-md border border-neutral-100 object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-red-50 text-brand-red"><PackageCheck className="h-5 w-5" /></span>}
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 break-words text-sm font-semibold text-brand-ink [overflow-wrap:anywhere]">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Link hoàn tiền đã sẵn sàng
          </h2>
          <p className="mt-0.5 line-clamp-2 break-words text-[11px] font-normal leading-4 text-neutral-700 [overflow-wrap:anywhere]">{data.productName || "Sản phẩm Shopee/TikTok Shop"}</p>
          <p className="mt-1 break-words text-[11px] leading-4 [overflow-wrap:anywhere]">
            <strong className="font-semibold text-brand-ink">Hoàn dự kiến: </strong>
            <span className="font-bold text-brand-red">{data.cashbackAmount || "Đang cập nhật"}</span>
          </p>
        </div>
      </div>
      <a href={data.affiliateUrl} target="_blank" rel="noreferrer" className="mt-2 flex h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-md bg-[#287a63] px-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#216653]">
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">Quay lại {platformLabel} để mua hàng</span>
      </a>
      <div className="mt-2 break-words text-xs leading-5 text-neutral-500 [overflow-wrap:anywhere]">
        <strong className="block font-semibold text-neutral-700">Lưu ý:</strong>
        <span className="block">• Để giỏ hàng trống trước khi mở link.</span>
        <span className="block">• Bấm link 2 lần để tăng khả năng đơn được ghi nhận.</span>
      </div>
    </div>
  );
}
