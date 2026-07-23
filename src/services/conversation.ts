import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { detectIntent, normalizeVietnamese } from "@/services/intent";
import { findKnowledgeAnswer } from "@/services/knowledge";
import { recordUnrecognizedMessage } from "@/services/unrecognized";
import { classifyIntentFallback } from "@/services/intent-fallback";
import { findDynamicIntentCommand } from "@/services/dynamic-intent";
import { emailSchema, passwordSchema, phoneSchema, urlSchema } from "@/lib/validators";
import { createCashbackLink, type CashbackLinkResult } from "@/services/cashback-link";
import {
  completeOpenApi2fa,
  forgotPasswordWithOpenApi,
  loginWithOpenApi,
  registerWithOpenApi,
  type AuthResult,
  type AuthSuccess
} from "@/services/openapi-auth";
import {
  changePassword,
  createWithdrawal,
  deleteAccount,
  claimTask,
  getAccount,
  getActivityLogs,
  getBalanceLogs,
  getNotifications,
  getAllOrders,
  getOrders,
  getReferrals,
  getSecurityStatus,
  getSessions,
  getTasks,
  getUnreadNotificationCount,
  getWithdrawals,
  markAllNotificationsRead,
  markNotificationRead,
  revokeOtherSessions,
  revokeSession,
  sendWithdrawalOtp,
  syncTask,
  updateProfile
} from "@/services/openapi-member";

type SessionState = {
  step?: string;
  email?: string;
  register?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  twoFactor?: {
    challengeToken: string;
    method?: string;
  };
  account?: {
    id?: string;
    email?: string;
    name?: string;
    phone?: string;
    balance?: number | string;
    token: string;
    tokenType: string;
    accountKey: string;
  };
  withdrawalDraft?: {
    amount?: number;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  };
  pendingSensitiveAction?: "delete_account" | "revoke_other_sessions";
  pendingClarification?: "delete_target";
};

const startMessage = "Chào bạn, em là Ry 👋\n\nEm sẽ giúp bạn tạo link hoàn tiền và kiểm tra tài khoản thật nhanh.\n\n• Đã có tài khoản: chọn Đăng nhập hoặc nhập 1\n• Chưa có tài khoản: chọn Đăng ký hoặc nhập 2";
const readyMessage = "Đăng nhập thành công rồi ạ 🎉\n\nBạn gửi Ry link sản phẩm Shopee hoặc TikTok Shop nhé. Ry sẽ tạo link hoàn tiền giúp bạn.";
const loginErrorPrefix = "LOGIN_ERROR:";

const guideMessage = [
  "Ry hướng dẫn bạn nhé:",
  "1. Đăng nhập hoặc tạo tài khoản.",
  "2. Gửi Ry link sản phẩm Shopee hoặc TikTok Shop.",
  "3. Khi Ry tạo link xong, bấm nút Mua ngay để quay lại sàn.",
  "4. Trước khi mua, bạn nên để giỏ hàng trống và mở link 2 lần để tăng khả năng đơn được ghi nhận.",
  "",
  "Bạn cũng có thể hỏi Ry bằng câu tự nhiên, ví dụ “ví còn bao nhiêu?” hoặc “xem đơn Shopee đang chờ”.",
  "",
  "Các lệnh nhanh:",
  "/huongdan - xem hướng dẫn",
  "/hotro - gặp hướng dẫn hỗ trợ",
  "/taikhoan hoặc /sodu - xem hồ sơ, số dư ví, thống kê",
  "/donhang status=approved platform=shopee - xem đơn hoàn tiền",
  "/thongbao - xem thông báo chưa đọc",
  "/doctatca - đánh dấu tất cả thông báo đã đọc",
  "/lichsurut - xem lịch sử rút tiền",
  "/ruttien - tạo yêu cầu rút tiền từng bước",
  "/ruttien 50000_bank_Techcombank_190123_NGUYEN VAN A - gửi nhanh yêu cầu rút tiền",
  "/capnhat Họ tên|Số điện thoại - cập nhật hồ sơ",
  "/doimatkhau mật_khẩu_cũ|mật_khẩu_mới|nhập_lại_mật_khẩu_mới - đổi mật khẩu",
  "/xoataikhoan - tự xóa tài khoản nếu hệ thống cho phép",
  "/nhiemvu - xem nhiệm vụ và tiến độ nhận thưởng",
  "/nhiemvu sync ID hoặc /nhiemvu claim ID - đồng bộ/nhận thưởng",
  "/gioithieu - xem link, F1/F2 và hoa hồng giới thiệu",
  "/biendongsodu - xem lịch sử cộng/trừ ví",
  "/nhatky - xem nhật ký hoạt động tài khoản",
  "/baomat - xem trạng thái 2FA và OTP email",
  "/phien - xem các thiết bị đang đăng nhập",
  "/phien revoke ID hoặc /phien revoke-others - thu hồi phiên đăng nhập",
  "/xoachat - xóa nội dung chat hiện tại"
].join("\n");

const supportMessage = [
  "Ry rất tiếc vì chưa thể tự giải quyết việc này. Bạn liên hệ đội hỗ trợ qua một trong các kênh sau nhé:",
  "Điện thoại: 0375823061",
  "Zalo: https://zalo.me/g/5lqqyvfhem7kgbrjxk7k",
  "Email: hotro@hoantienmuahang.vn",
  "Trang chính thức: https://hoantienmuahang.vn",
  "Thời gian hỗ trợ: 8:00–20:00 hằng ngày",
  "",
  "Khi liên hệ, bạn gửi kèm email tài khoản hoặc mã đơn để được kiểm tra nhanh hơn nhé."
].join("\n");

function readState(raw: string): SessionState {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function accountWithToken(account: NonNullable<SessionState["account"]>) {
  return { ...account, token: decryptSecret(account.token) };
}

export async function getOpenApiAccountForSession(sessionId: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Không tìm thấy phiên chat.");
  const account = readState(session.state).account;
  if (!account) throw new Error("Bạn cần đăng nhập để quản lý thiết bị.");
  return accountWithToken(account);
}

function isLoginChoice(value: string) {
  return ["1", "login", "dang nhap", "đăng nhập", "signin", "sign in"].includes(normalize(value));
}

function isRegisterChoice(value: string) {
  return ["2", "register", "dang ky", "đăng ký", "signup", "sign up"].includes(normalize(value));
}

function isClearChatCommand(value: string) {
  return ["/xoachat", "/xoa-chat", "/clear", "/clearchat", "/clear-chat"].includes(normalize(value));
}

function isGuideCommand(value: string) {
  return ["/huongdan", "/hướngdẫn", "/huong-dan", "/help"].includes(normalize(value));
}

function isSupportCommand(value: string) {
  return ["/hotro", "/ho-tro", "/support", "hỗ trợ", "ho tro"].includes(normalize(value));
}

function isRetryLoginCommand(value: string) {
  return ["/nhaplai", "/nhap-lai", "nhập lại", "nhap lai", "nhập lại email", "nhap lai email"].includes(normalize(value));
}

function isForgotPasswordCommand(value: string) {
  return ["/quenmatkhau", "/quen-mat-khau", "quên mật khẩu", "quen mat khau", "forgot password"].includes(normalize(value));
}

function isCancelCommand(value: string) {
  return ["/huy", "/cancel", "hủy", "huy", "không", "khong", "thoát", "thoat", "quay lại", "quay lai"].includes(normalize(value));
}

function isMemberCommand(value: string) {
  const command = normalize(value).split(/\s+/, 1)[0];
  return [
    "/taikhoan",
    "/sodu",
    "/donhang",
    "/thongbao",
    "/doctatca",
    "/lichsurut",
    "/trasoat",
    "/ruttien",
    "/capnhat",
    "/doimatkhau",
    "/xoataikhoan",
    "/xacnhan-xoataikhoan",
    "/nhiemvu",
    "/gioithieu",
    "/giới",
    "/biendongsodu",
    "/nhatky",
    "/baomat",
    "/phien"
  ].includes(command);
}

function isWithdrawalFlowCommand(value: string) {
  return normalize(value).startsWith("/ruttien");
}

async function saveBot(sessionId: string, content: string) {
  return prisma.chatMessage.create({ data: { sessionId, sender: "BOT", content } });
}

async function updateSession(sessionId: string, state: SessionState) {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { state: JSON.stringify(state) }
  });
}

export async function createChatSession() {
  const session = await prisma.chatSession.create({ data: { state: JSON.stringify({ step: "auth_choice" }) } });
  await saveBot(session.id, startMessage);
  return getSessionPayload(session.id);
}

export async function createAuthenticatedChatSession(result: AuthResult, existingState: SessionState = {}) {
  const session = await prisma.chatSession.create({ data: { state: JSON.stringify({ step: "auth_pending" }) } });
  const state: SessionState = { ...existingState };
  await applyAuthResult(session.id, state, result);
  return getSessionPayload(session.id);
}

export async function loginChatSession(email: string, password: string) {
  const parsedEmail = emailSchema.parse(email);
  const result = await loginWithOpenApi(parsedEmail, password);
  return createAuthenticatedChatSession(result, { email: parsedEmail });
}

export async function registerChatSession(input: { email: string; password: string; passwordConfirmation: string; name?: string; phone?: string; referralCode?: string }) {
  const parsedEmail = emailSchema.parse(input.email);
  const parsedPassword = passwordSchema.parse(input.password);
  if (parsedPassword !== input.passwordConfirmation) throw new Error("Mật khẩu xác nhận chưa khớp.");
  const parsedPhone = input.phone ? phoneSchema.parse(input.phone) : undefined;

  const result = await registerWithOpenApi({
    email: parsedEmail,
    password: parsedPassword,
    passwordConfirmation: input.passwordConfirmation,
    name: input.name?.trim() || undefined,
    phone: parsedPhone,
    referralCode: input.referralCode?.trim() || undefined
  });

  return createAuthenticatedChatSession(result, {
    register: {
      email: parsedEmail,
      name: input.name?.trim() || undefined,
      phone: parsedPhone
    }
  });
}

export async function completeChatSessionTwoFactor(sessionId: string, code: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Không tìm thấy phiên xác thực.");
  const state = readState(session.state);
  if (!state.twoFactor?.challengeToken) throw new Error("Phiên 2FA đã hết hạn.");

  await applyAuthResult(sessionId, state, await completeOpenApi2fa(state.twoFactor.challengeToken, code, state.twoFactor.method));
  return getSessionPayload(sessionId);
}

export async function forgotChatPassword(email: string) {
  return forgotPasswordWithOpenApi(emailSchema.parse(email));
}

export async function restoreChatSession(sessionId: string) {
  return getSessionPayload(sessionId);
}

export async function logoutChatSession(sessionId: string) {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      state: JSON.stringify({ step: "auth_choice" })
    }
  });

  return createChatSession();
}

export async function getUserChatHistory(sessionId: string) {
  const current = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  const accountKey = readState(current?.state ?? "{}").account?.accountKey;
  if (!accountKey) return [];

  const sessions = await prisma.chatSession.findMany({
    where: { state: { contains: `"accountKey":"${accountKey}"` } },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 20
  });

  return sessions.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastMessage: item.messages[0]?.content ?? "Chưa có tin nhắn",
    messageCount: item._count.messages
  }));
}

export async function getSessionPayload(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
  if (!session) throw new Error("Không tìm thấy phiên chat.");

  const state = readState(session.state);

  return {
    id: session.id,
    user: state.account
      ? {
          id: state.account.id ?? state.account.accountKey,
          phone: state.account.phone ?? "",
          email: state.account.email ?? "",
          userId: state.account.id ?? state.account.accountKey,
          name: state.account.name,
          balance: state.account.balance
        }
      : null,
    messages: session.messages.map((message) => ({
      id: message.id,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt
    }))
  };
}

export async function handleUserMessage(sessionId: string, content: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Không tìm thấy phiên chat.");

  const state = readState(session.state);
  const sensitiveStep = ["login_password", "register_password", "register_password_confirmation", "two_factor"].includes(state.step ?? "");
  const sensitiveCommand = normalize(content).startsWith("/doimatkhau");
  await prisma.chatMessage.create({
    data: { sessionId, sender: "USER", content: sensitiveStep || sensitiveCommand ? "[Thông tin bảo mật đã được ẩn]" : content }
  });
  let text = content.trim();
  let confirmedRevokeOthers = false;
  const normalizedInput = normalizeVietnamese(content);
  const canUnderstandIntent = Boolean(state.account) || ["auth_choice", "awaiting_email", undefined].includes(state.step);
  const detectedIntent = canUnderstandIntent ? detectIntent(text) : null;
  if (detectedIntent) text = detectedIntent.command;
  else {
    const dynamicCommand = await findDynamicIntentCommand(text, Boolean(state.account));
    if (dynamicCommand) text = dynamicCommand;
  }

  if (state.pendingClarification === "delete_target") {
    if (["chat", "tro chuyen", "cuoc tro chuyen", "tin nhan"].some((value) => normalizedInput.includes(value))) {
      state.pendingClarification = undefined;
      text = "/xoachat";
    } else if (["tai khoan", "account"].some((value) => normalizedInput.includes(value))) {
      state.pendingClarification = undefined;
      text = "/xoataikhoan";
    } else if (isCancelCommand(text)) {
      state.pendingClarification = undefined;
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Được rồi ạ, Ry không xóa gì cả. Dữ liệu của bạn vẫn giữ nguyên nhé.");
      return getSessionPayload(sessionId);
    } else {
      await saveBot(sessionId, "Bạn muốn Ry xóa phần nào ạ?\n\n• Nhập “xóa chat” để dọn cuộc trò chuyện\n• Nhập “xóa tài khoản” để đóng tài khoản\n• Nhập “không xóa nữa” để hủy");
      return getSessionPayload(sessionId);
    }
  }

  if (text === "/lamro-xoa") {
    state.pendingClarification = "delete_target";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Bạn muốn Ry xóa phần nào ạ?\n\n• Xóa cuộc trò chuyện hiện tại\n• Xóa tài khoản\n• Không xóa gì cả");
    return getSessionPayload(sessionId);
  }

  if (state.pendingSensitiveAction === "delete_account") {
    if (["1", "dong y", "xac nhan", "xoa di", "xoa tai khoan"].includes(normalizedInput)) {
      text = "/xacnhan-xoataikhoan";
    } else if (isCancelCommand(text) || normalizedInput === "2") {
      state.pendingSensitiveAction = undefined;
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Ry đã hủy yêu cầu xóa tài khoản. Tài khoản và dữ liệu của bạn vẫn được giữ nguyên nhé.");
      return getSessionPayload(sessionId);
    } else if (text !== "/xoataikhoan" && text !== "/xacnhan-xoataikhoan") {
      await saveBot(sessionId, "Ry đang chờ bạn xác nhận:\n• Nhập 1 hoặc “đồng ý” để tiếp tục xóa tài khoản\n• Nhập 2 hoặc “không xóa nữa” để hủy");
      return getSessionPayload(sessionId);
    }
  }

  if (state.pendingSensitiveAction === "revoke_other_sessions") {
    if (["1", "dong y", "xac nhan", "dang xuat"].includes(normalizedInput)) {
      state.pendingSensitiveAction = undefined;
      await updateSession(sessionId, state);
      text = "/phien revoke-others";
      confirmedRevokeOthers = true;
    } else if (isCancelCommand(text) || normalizedInput === "2") {
      state.pendingSensitiveAction = undefined;
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Ry đã hủy. Các thiết bị khác vẫn đăng nhập bình thường nhé.");
      return getSessionPayload(sessionId);
    } else {
      await saveBot(sessionId, "Ry đang chờ bạn xác nhận đăng xuất các thiết bị khác.");
      return getSessionPayload(sessionId);
    }
  }

  if (text === "/chao") {
    await saveBot(sessionId, state.account ? "Ry đây ạ 👋 Hôm nay bạn muốn kiểm tra đơn hàng, số dư hay tạo link hoàn tiền?" : startMessage);
    return getSessionPayload(sessionId);
  }

  if (text === "/camon") {
    await saveBot(sessionId, "Không có gì ạ 😊 Giúp được bạn là Ry vui rồi. Khi cần kiểm tra đơn hoặc tạo link, bạn cứ nhắn Ry nhé.");
    return getSessionPayload(sessionId);
  }

  if (text === "/ry-la-ai") {
    await saveBot(sessionId, "Em là Ry, trợ lý hoàn tiền của bạn 🤖\n\nRy có thể tạo link sản phẩm, kiểm tra đơn 10 ngày gần nhất, xem số dư, hỗ trợ rút tiền và hướng dẫn các vấn đề thường gặp.");
    return getSessionPayload(sessionId);
  }

  if (isGuideCommand(text)) {
    await saveBot(sessionId, guideMessage);
    return getSessionPayload(sessionId);
  }

  if (isSupportCommand(text)) {
    await saveBot(sessionId, supportMessage);
    await writeAuditLog({
      actorType: state.account ? "USER" : "SYSTEM",
      actorId: state.account?.accountKey ?? sessionId,
      action: detectedIntent?.intent === "SUPPORT" ? "SUPPORT_HANDOFF_REQUEST" : "SUPPORT_INFO_VIEW",
      targetType: "ChatSession",
      targetId: sessionId
    });
    if (detectedIntent?.intent === "SUPPORT") {
      await saveBot(sessionId, "Ry đã ghi nhận yêu cầu hỗ trợ cùng nội dung cuộc trò chuyện này rồi ạ. Bạn có thể liên hệ qua các kênh phía trên để được hỗ trợ sớm hơn nhé.");
    }
    return getSessionPayload(sessionId);
  }

  if (text.startsWith("/page ")) {
    const slug = text.slice("/page ".length).trim();
    if (/^[a-z0-9-]{1,100}$/i.test(slug)) {
      await saveBot(sessionId, `STATIC_PAGE:${JSON.stringify({ slug })}`);
    } else {
      await saveBot(sessionId, "Ry chưa tìm thấy trang thông tin phù hợp.");
    }
    return getSessionPayload(sessionId);
  }

  if (isClearChatCommand(text)) {
    await clearCurrentChat(sessionId, state);
    return getSessionPayload(sessionId);
  }

  if (state.account && state.step?.startsWith("withdrawal_") && text.startsWith("/") && !isWithdrawalFlowCommand(text)) {
    state.step = "ready_for_link";
    state.withdrawalDraft = undefined;
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Ry đã hủy phần rút tiền đang làm dở để chuyển sang yêu cầu mới của bạn.");
  } else if (state.account && state.step?.startsWith("withdrawal_")) {
    await handleWithdrawalStep(sessionId, text, state);
    return getSessionPayload(sessionId);
  }

  if (!state.account && isMemberCommand(text)) {
    await saveBot(sessionId, `Bạn đăng nhập trước để Ry kiểm tra đúng thông tin tài khoản nhé.\n\n${startMessage}`);
    return getSessionPayload(sessionId);
  }

  if (!state.account && (isRetryLoginCommand(text) || isForgotPasswordCommand(text))) {
    return handleLoginRecoveryAction(sessionId, text, state);
  }

  if (!state.account && isAuthFlowStep(state.step) && isCancelCommand(text)) {
    return cancelAuthFlow(sessionId, state);
  }

  if (!state.account && isAuthFlowStep(state.step) && state.step !== "auth_choice") {
    if (isLoginChoice(text)) return switchToLogin(sessionId, state);
    if (isRegisterChoice(text)) return switchToRegister(sessionId, state);
  }

  if (state.account && state.pendingSensitiveAction && isCancelCommand(text)) {
    state.pendingSensitiveAction = undefined;
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Ry đã hủy thao tác này. Tài khoản của bạn chưa có gì thay đổi nhé.");
    return getSessionPayload(sessionId);
  }

  if (state.account && isMemberCommand(text)) {
    if (text === "/phien revoke-others" && !confirmedRevokeOthers) {
      state.pendingSensitiveAction = "revoke_other_sessions";
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Bạn muốn đăng xuất tài khoản khỏi tất cả thiết bị khác đúng không ạ?\n\nThiết bị bạn đang dùng vẫn được giữ đăng nhập.");
      return getSessionPayload(sessionId);
    }
    if (detectedIntent?.intent === "WITHDRAW" && detectedIntent.parameters?.amount) {
      await saveBot(sessionId, `WITHDRAWAL_FORM:${JSON.stringify({ amount: detectedIntent.parameters.amount })}`);
      return getSessionPayload(sessionId);
    }
    await handleMemberCommand(sessionId, text, state);
    return getSessionPayload(sessionId);
  }

  if (state.account) {
    if (urlSchema.safeParse(text).success) {
      await handleProductLink(sessionId, text, state);
      return getSessionPayload(sessionId);
    }
    const answer = await findKnowledgeAnswer(content);
    if (answer) {
      await saveBot(sessionId, answer.content);
      await writeAuditLog({ actorType: "USER", actorId: state.account.accountKey, action: "KNOWLEDGE_ANSWER", targetType: "KnowledgeEntry", targetId: answer.entryId, metadata: { confidence: answer.confidence } });
    } else {
      const fallbackIntent = await classifyIntentFallback(content);
      if (fallbackIntent) {
        await handleMemberCommand(sessionId, fallbackIntent.command, state);
        await writeAuditLog({ actorType: "USER", actorId: state.account.accountKey, action: "AI_INTENT_FALLBACK", targetType: "ChatSession", targetId: sessionId, metadata: { intent: fallbackIntent.intent, confidence: fallbackIntent.confidence } });
        return getSessionPayload(sessionId);
      }
      await recordUnrecognizedMessage(sessionId, content);
      await saveBot(sessionId, "Ry chưa hiểu rõ ý bạn nên không muốn trả lời sai 😊\n\nBạn thử nói ngắn gọn hơn, chọn một chức năng trong menu hoặc nhập “gặp nhân viên” để được hỗ trợ nhé.");
    }
    return getSessionPayload(sessionId);
  }

  if (!detectedIntent && ["auth_choice", "awaiting_email", undefined].includes(state.step)) {
    const answer = await findKnowledgeAnswer(content);
    if (answer) {
      await saveBot(sessionId, answer.content);
      return getSessionPayload(sessionId);
    }
  }

  switch (state.step) {
    case "awaiting_email":
      state.step = "auth_choice";
      await updateSession(sessionId, state);
      await saveBot(sessionId, startMessage);
      return getSessionPayload(sessionId);
    case "auth_choice":
      return handleAuthChoice(sessionId, text, state);
    case "login_email":
      return handleLoginEmail(sessionId, text, state);
    case "register_email":
      return handleRegisterEmail(sessionId, text, state);
    case "login_password":
      return handleLoginPassword(sessionId, text, state);
    case "register_name":
      state.register = { ...state.register, name: text };
      state.step = "register_phone";
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Bạn nhập số điện thoại để Ry hoàn tất thông tin nhé.");
      return getSessionPayload(sessionId);
    case "register_phone":
      return handleRegisterPhone(sessionId, text, state);
    case "register_password":
      return handleRegisterPasswordStep(sessionId, text, state);
    case "register_password_confirmation":
      return handleRegisterPasswordConfirmation(sessionId, text, state);
    case "two_factor":
      return handleTwoFactor(sessionId, text, state);
    default:
      state.step = "awaiting_email";
      await updateSession(sessionId, state);
      await saveBot(sessionId, startMessage);
      return getSessionPayload(sessionId);
  }
}

export async function getNotificationSnapshot(sessionId: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  const account = readState(session?.state ?? "{}").account;
  if (!account) return { unreadCount: 0 };

  const authAccount = accountWithToken(account);
  const unreadCount = await getUnreadNotificationCount(authAccount.token, authAccount.tokenType);
  return { unreadCount };
}

async function clearCurrentChat(sessionId: string, state: SessionState) {
  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  await updateSession(sessionId, state);
  await saveBot(sessionId, state.account ? `Ry đã dọn cuộc trò chuyện cũ rồi ạ.\n\n${readyMessage}` : `Ry đã dọn cuộc trò chuyện cũ rồi ạ.\n\n${startMessage}`);
}

async function handleMemberCommand(sessionId: string, text: string, state: SessionState) {
  const account = accountWithToken(state.account!);
  const [command] = normalize(text).split(/\s+/, 1);

  try {
    if (command === "/taikhoan" || command === "/sodu") {
      await saveBot(sessionId, formatAccount(await getAccount(account.token, account.tokenType)));
      return;
    }

    if (command === "/donhang") {
      const all = isAllOrderRequest(text);
      const query = parseOrderQuery(text);
      const data = all
        ? await getAllOrders(account.token, account.tokenType, query)
        : await getOrders(account.token, account.tokenType, query);
      await saveBot(sessionId, formatOrders(data, all));
      return;
    }

    if (command === "/thongbao") {
      const [, action, id] = text.trim().split(/\s+/);
      if (action === "read" && id) {
        await markNotificationRead(account.token, account.tokenType, id);
        await saveBot(sessionId, formatNotifications(await getNotifications(account.token, account.tokenType, { filter: "unread" })));
        return;
      }
      await saveBot(sessionId, formatNotifications(await getNotifications(account.token, account.tokenType, { filter: "unread" })));
      return;
    }

    if (command === "/doctatca") {
      await markAllNotificationsRead(account.token, account.tokenType);
      await saveBot(sessionId, "Ry đã đánh dấu tất cả thông báo là đã đọc rồi nhé.");
      return;
    }

    if (command === "/lichsurut") {
      const fullHistory = /\b(all|tat ca|toan bo)\b/.test(normalizeVietnamese(text));
      const page = Math.max(1, Number(text.match(/\bpage=(\d+)/i)?.[1] ?? 1));
      const perPage = fullHistory ? 5 : 2;
      await saveBot(sessionId, formatWithdrawals(await getWithdrawals(account.token, account.tokenType, page, perPage), fullHistory));
      return;
    }

    if (command === "/trasoat") {
      const category = text.match(/\bcategory=(MISSING_ORDER|WRONG_CASHBACK|DELAYED|REJECTED|ACCOUNT|OTHER)\b/i)?.[1]?.toUpperCase() ?? "MISSING_ORDER";
      await saveBot(sessionId, `TICKET_FORM:${JSON.stringify({ category })}`);
      return;
    }

    if (command === "/ruttien") {
      if (isWithdrawalOtpRequest(text)) {
        await sendWithdrawalOtp(account.token, account.tokenType);
        await saveBot(sessionId, "Ry đã gửi mã OTP đến email của bạn. Bạn kiểm tra cả hộp thư rác nếu chưa thấy nhé.");
        return;
      }

      const payload = parseWithdrawalCommand(text);
      if (!payload) {
        await saveBot(sessionId, "WITHDRAWAL_FORM:{}");
        return;
      }
      await saveBot(sessionId, formatGenericSuccess(await createWithdrawal(account.token, account.tokenType, payload), "Đã tạo yêu cầu rút tiền."));
      return;
    }

    if (command === "/capnhat") {
      const payload = parseProfileCommand(text);
      if (!payload) {
        await saveBot(sessionId, "Bạn nhập theo mẫu này giúp Ry nhé:\n/capnhat Họ tên|Số điện thoại\n\nVí dụ: /capnhat Nguyễn Văn An|0912345678");
        return;
      }
      await saveBot(sessionId, formatGenericSuccess(await updateProfile(account.token, account.tokenType, payload), "Đã cập nhật hồ sơ."));
      return;
    }

    if (command === "/doimatkhau") {
      const payload = parsePasswordCommand(text);
      if (!payload) {
        await saveBot(sessionId, "Để bảo mật, bạn vui lòng đổi mật khẩu trong biểu mẫu tài khoản. Không gửi mật khẩu trong nội dung chat nhé.");
        return;
      }
      await saveBot(sessionId, formatGenericSuccess(await changePassword(account.token, account.tokenType, payload), "Đã đổi mật khẩu."));
      return;
    }

    if (command === "/xoataikhoan") {
      state.pendingSensitiveAction = "delete_account";
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Bạn đang yêu cầu xóa tài khoản. Sau khi xóa, dữ liệu có thể không khôi phục được.\n\n• Chắc chắn muốn xóa: nhập /xacnhan-xoataikhoan\n• Không muốn xóa nữa: nhập /huy");
      return;
    }

    if (command === "/xacnhan-xoataikhoan") {
      if (state.pendingSensitiveAction !== "delete_account") {
        await saveBot(sessionId, "Hiện không có yêu cầu xóa tài khoản nào cần xác nhận. Tài khoản của bạn vẫn an toàn nhé.");
        return;
      }
      await deleteAccount(account.token, account.tokenType);
      await writeAuditLog({ actorType: "USER", actorId: account.accountKey, action: "ACCOUNT_DELETE_REQUEST", targetType: "Account", targetId: account.accountKey });
      state.pendingSensitiveAction = undefined;
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Ry đã gửi yêu cầu xóa tài khoản. Nếu cần hỗ trợ thêm, bạn cứ nhập “gặp nhân viên” nhé.");
      return;
    }

    if (command === "/nhiemvu") {
      const [, action, id] = text.trim().split(/\s+/);
      if (action === "sync" && id) {
        await saveBot(sessionId, formatGenericSuccess(await syncTask(account.token, account.tokenType, id), "Đã đồng bộ tiến độ nhiệm vụ."));
        return;
      }
      if (action === "claim" && id) {
        await saveBot(sessionId, formatGenericSuccess(await claimTask(account.token, account.tokenType, id), "Đã nhận thưởng nhiệm vụ."));
        await saveBot(sessionId, formatTasks(await getTasks(account.token, account.tokenType)));
        return;
      }
      await saveBot(sessionId, formatTasks(await getTasks(account.token, account.tokenType)));
      return;
    }

    if (command === "/gioithieu" || normalizeVietnamese(text) === "/gioi thieu") {
      await saveBot(sessionId, formatReferrals(await getReferrals(account.token, account.tokenType)));
      return;
    }

    if (command === "/biendongsodu") {
      await saveBot(sessionId, formatBalanceLogs(await getBalanceLogs(account.token, account.tokenType)));
      return;
    }

    if (command === "/nhatky") {
      await saveBot(sessionId, formatActivityLogs(await getActivityLogs(account.token, account.tokenType)));
      return;
    }

    if (command === "/baomat") {
      await saveBot(sessionId, formatSecurity(await getSecurityStatus(account.token, account.tokenType)));
      return;
    }

    if (command === "/phien") {
      const [, action, id] = text.trim().split(/\s+/);
      if (action === "revoke" && id) {
        await writeAuditLog({ actorType: "USER", actorId: account.accountKey, action: "SESSION_REVOKE_ATTEMPT", targetType: "RemoteSession", targetId: id });
        await saveBot(sessionId, formatGenericSuccess(await revokeSession(account.token, account.tokenType, id), "Đã thu hồi phiên đăng nhập."));
        return;
      }
      if (action === "revoke-others") {
        await writeAuditLog({ actorType: "USER", actorId: account.accountKey, action: "SESSION_REVOKE_OTHERS_ATTEMPT", targetType: "Account", targetId: account.accountKey });
        await saveBot(sessionId, formatGenericSuccess(await revokeOtherSessions(account.token, account.tokenType), "Đã đăng xuất các thiết bị khác."));
        return;
      }
      await saveBot(sessionId, formatSessions(await getSessions(account.token, account.tokenType)));
      return;
    }
  } catch (error) {
    await saveBot(sessionId, error instanceof Error ? `Ry chưa xử lý được yêu cầu này: ${error.message}\n\nBạn thử lại sau ít phút nhé.` : "Ry chưa xử lý được yêu cầu này. Bạn thử lại sau ít phút nhé.");
  }
}

async function handleWithdrawalStep(sessionId: string, text: string, state: SessionState) {
  const account = accountWithToken(state.account!);
  const draft = state.withdrawalDraft ?? {};
  const normalized = normalize(text);

  if (["2", "huy", "hủy", "cancel", "/huy"].includes(normalized)) {
    state.step = "ready_for_link";
    state.withdrawalDraft = undefined;
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Ry đã hủy yêu cầu rút tiền. Số dư của bạn không thay đổi nhé.");
    return;
  }

  if (state.step === "withdrawal_amount") {
    const amount = Number(text.replace(/[^\d]/g, ""));
    if (!Number.isFinite(amount) || amount <= 10000) {
      await saveBot(sessionId, "Số tiền rút cần lớn hơn 10.000đ. Bạn chỉ cần nhập số, ví dụ: 50000.");
      return;
    }
    state.withdrawalDraft = { ...draft, amount };
    state.step = "withdrawal_bank";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Bạn muốn nhận tiền qua ngân hàng nào?\nVí dụ: Techcombank");
    return;
  }

  if (state.step === "withdrawal_bank") {
    state.withdrawalDraft = { ...draft, bank_name: text };
    state.step = "withdrawal_account_number";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Bạn nhập số tài khoản nhận tiền nhé. Ry sẽ cho bạn kiểm tra lại trước khi gửi yêu cầu.");
    return;
  }

  if (state.step === "withdrawal_account_number") {
    state.withdrawalDraft = { ...draft, account_number: text };
    state.step = "withdrawal_account_name";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Bạn nhập tên chủ tài khoản đúng như trên ngân hàng nhé.");
    return;
  }

  if (state.step === "withdrawal_account_name") {
    const nextDraft = { ...draft, account_name: text };
    state.withdrawalDraft = nextDraft;
    state.step = "withdrawal_confirm";
    await updateSession(sessionId, state);
    await saveBot(
      sessionId,
      [
        "Bạn kiểm tra lại thông tin rút tiền nhé:",
        `Số tiền: ${formatMoney(nextDraft.amount)} VND`,
        `Ngân hàng: ${nextDraft.bank_name}`,
        `Số tài khoản: ${nextDraft.account_number}`,
        `Chủ tài khoản: ${nextDraft.account_name}`,
        "",
        "Thông tin ngân hàng cần chính xác để tiền về đúng tài khoản.",
        "• Đúng thông tin: nhập 1 để gửi yêu cầu",
        "• Cần dừng lại: nhập 2 để hủy"
      ].join("\n")
    );
    return;
  }

  if (state.step === "withdrawal_confirm") {
    if (normalized === "2") {
      state.step = "ready_for_link";
      state.withdrawalDraft = undefined;
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Ry đã hủy yêu cầu rút tiền. Số dư của bạn không thay đổi nhé.");
      return;
    }

    if (!["1", "xac nhan", "xác nhận", "confirm"].includes(normalized)) {
      await saveBot(sessionId, "Ry cần bạn xác nhận trước khi gửi yêu cầu:\n• Nhập 1 để đồng ý\n• Nhập 2 để hủy");
      return;
    }

    if (!draft.amount || !draft.bank_name || !draft.account_number || !draft.account_name) {
      state.step = "withdrawal_amount";
      state.withdrawalDraft = {};
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Ry chưa nhận đủ thông tin rút tiền. Mình làm lại từ số tiền nhé.");
      return;
    }

    try {
      await saveBot(
        sessionId,
        formatGenericSuccess(
          await createWithdrawal(account.token, account.tokenType, {
            amount: draft.amount,
            payment_method: "bank",
            bank_name: draft.bank_name,
            account_number: draft.account_number,
            account_name: draft.account_name
          }),
          "Đã tạo yêu cầu rút tiền."
        )
      );
    } catch (error) {
      await saveBot(sessionId, error instanceof Error ? `Ry chưa tạo được yêu cầu rút tiền: ${error.message}\nBạn kiểm tra lại thông tin hoặc thử lại sau nhé.` : "Ry chưa tạo được yêu cầu rút tiền. Bạn thử lại sau nhé.");
    } finally {
      state.step = "ready_for_link";
      state.withdrawalDraft = undefined;
      await updateSession(sessionId, state);
    }
  }
}

async function handleEmail(sessionId: string, text: string, state: SessionState) {
  const email = emailSchema.safeParse(text);
  if (!email.success) {
    await saveBot(sessionId, email.error.issues[0]?.message ?? "Email không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.email = email.data;
  state.step = "auth_choice";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Ry đã nhận được email. Bây giờ bạn chọn:\n• Nhập 1 để đăng nhập\n• Nhập 2 để tạo tài khoản mới");
  return getSessionPayload(sessionId);
}

async function handleLoginEmail(sessionId: string, text: string, state: SessionState) {
  const email = emailSchema.safeParse(text);
  if (!email.success) {
    await saveBot(sessionId, email.error.issues[0]?.message ?? "Email không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.email = email.data;
  state.step = "login_password";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Bạn nhập mật khẩu để đăng nhập nhé. Ry sẽ không lưu mật khẩu trong lịch sử chat.");
  return getSessionPayload(sessionId);
}

async function handleRegisterEmail(sessionId: string, text: string, state: SessionState) {
  const email = emailSchema.safeParse(text);
  if (!email.success) {
    await saveBot(sessionId, email.error.issues[0]?.message ?? "Email không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.email = email.data;
  state.register = { email: email.data };
  state.step = "register_name";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Ry gọi bạn là gì nhỉ? Bạn nhập họ tên đầy đủ nhé.");
  return getSessionPayload(sessionId);
}

async function handleAuthChoice(sessionId: string, text: string, state: SessionState) {
  if (isLoginChoice(text)) {
    return switchToLogin(sessionId, state);
  }

  if (isRegisterChoice(text)) {
    return switchToRegister(sessionId, state);
  }

  await saveBot(sessionId, startMessage);
  return getSessionPayload(sessionId);
}

function isAuthFlowStep(step?: string) {
  return [
    "awaiting_email",
    "auth_choice",
    "login_email",
    "login_password",
    "register_email",
    "register_name",
    "register_phone",
    "register_password",
    "register_password_confirmation",
    "two_factor"
  ].includes(step ?? "");
}

async function switchToLogin(sessionId: string, state: SessionState) {
  state.step = "login_email";
  state.email = undefined;
  state.register = undefined;
  state.twoFactor = undefined;
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Được rồi ạ, Ry chuyển sang đăng nhập. Bạn nhập email tài khoản nhé.");
  return getSessionPayload(sessionId);
}

async function switchToRegister(sessionId: string, state: SessionState) {
  state.step = "register_email";
  state.email = undefined;
  state.register = {};
  state.twoFactor = undefined;
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Được rồi ạ, Ry sẽ giúp bạn tạo tài khoản. Trước tiên, bạn nhập email nhé.");
  return getSessionPayload(sessionId);
}

async function cancelAuthFlow(sessionId: string, state: SessionState) {
  state.step = "auth_choice";
  state.email = undefined;
  state.register = undefined;
  state.twoFactor = undefined;
  await updateSession(sessionId, state);
  await saveBot(sessionId, `Ry đã hủy thao tác đang làm. Mình bắt đầu lại nhé.\n\n${startMessage}`);
  return getSessionPayload(sessionId);
}

async function handleLoginRecoveryAction(sessionId: string, text: string, state: SessionState) {
  if (isRetryLoginCommand(text)) {
    state.step = "login_email";
    state.email = undefined;
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Được rồi, Ry cho bạn nhập lại từ đầu. Bạn gửi email đăng nhập nhé.");
    return getSessionPayload(sessionId);
  }

  if (!state.email) {
    state.step = "login_email";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Bạn nhập email tài khoản trước nhé. Sau đó Ry sẽ hướng dẫn đặt lại mật khẩu.");
    return getSessionPayload(sessionId);
  }

  try {
    const message = await forgotPasswordWithOpenApi(state.email);
    state.step = "login_email";
    await updateSession(sessionId, state);
    await saveBot(sessionId, `${message}\n\nKhi đổi mật khẩu xong, bạn quay lại và nhập email để đăng nhập nhé.`);
  } catch (error) {
    await saveBot(sessionId, error instanceof Error ? `Ry chưa gửi được email đặt lại mật khẩu: ${error.message}` : "Ry chưa gửi được email đặt lại mật khẩu. Bạn thử lại sau ít phút nhé.");
  }

  return getSessionPayload(sessionId);
}

async function handleLoginPassword(sessionId: string, text: string, state: SessionState) {
  if (!state.email) {
    state.step = "awaiting_email";
    await updateSession(sessionId, state);
    await saveBot(sessionId, startMessage);
    return getSessionPayload(sessionId);
  }

  try {
    await applyAuthResult(sessionId, state, await loginWithOpenApi(state.email, text));
  } catch (error) {
    await saveBot(sessionId, formatLoginError(error instanceof Error ? error.message : "Không thể đăng nhập, vui lòng thử lại."));
  }

  return getSessionPayload(sessionId);
}

function formatLoginError(message: string) {
  return `${loginErrorPrefix}${JSON.stringify({
    title: "Đăng nhập chưa thành công",
    message: message || "Email hoặc mật khẩu chưa đúng. Bạn có thể nhập lại từ đầu hoặc dùng quên mật khẩu."
  })}`;
}

async function handleRegisterPhone(sessionId: string, text: string, state: SessionState) {
  const phone = phoneSchema.safeParse(text);
  if (!phone.success) {
    await saveBot(sessionId, phone.error.issues[0]?.message ?? "Số điện thoại không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.register = undefined;
  state.step = "auth_choice";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Bạn nhập mật khẩu trong biểu mẫu đăng ký an toàn nhé.");
  return getSessionPayload(sessionId);
}

async function handleRegisterPasswordStep(sessionId: string, text: string, state: SessionState) {
  const password = passwordSchema.safeParse(text);
  if (!password.success) {
    await saveBot(sessionId, password.error.issues[0]?.message ?? "Mật khẩu không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.register = undefined;
  state.step = "auth_choice";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Bạn nhập lại mật khẩu một lần nữa để tránh gõ nhầm nhé.");
  return getSessionPayload(sessionId);
}

async function handleRegisterPasswordConfirmation(sessionId: string, text: string, state: SessionState) {
  state.register = undefined;
  state.step = "auth_choice";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Ry đã xóa thông tin mật khẩu cũ để bảo vệ bạn. Bạn vui lòng dùng biểu mẫu Đăng ký an toàn nhé.");
  return getSessionPayload(sessionId);

  /* Legacy code below is intentionally unreachable and retained only for migration reference.
  const register = state.register as (typeof state.register & { password?: string });
  if (!register?.email || !register.password || !register.name || !register.phone) {
    state.step = "awaiting_email";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Thông tin đăng ký chưa đầy đủ. Vui lòng nhập lại email.");
    return getSessionPayload(sessionId);
  }

  if (text !== register.password) {
    await saveBot(sessionId, "Mật khẩu xác nhận chưa khớp. Vui lòng nhập lại.");
    return getSessionPayload(sessionId);
  }

  try {
    await applyAuthResult(
      sessionId,
      state,
      await registerWithOpenApi({
        email: register.email!,
        password: register.password!,
        passwordConfirmation: text,
        name: register.name,
        phone: register.phone
      })
    );
  } catch (error) {
    await saveBot(sessionId, error instanceof Error ? error.message : "Không thể đăng ký lúc này, vui lòng thử lại.");
  }

  return getSessionPayload(sessionId);
}

  */
}

async function handleTwoFactor(sessionId: string, text: string, state: SessionState) {
  if (!state.twoFactor?.challengeToken) {
    state.step = "login_password";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Mã xác thực đã hết hạn. Bạn nhập lại mật khẩu để Ry gửi yêu cầu mới nhé.");
    return getSessionPayload(sessionId);
  }

  try {
    await applyAuthResult(sessionId, state, await completeOpenApi2fa(state.twoFactor.challengeToken, text, state.twoFactor.method));
  } catch (error) {
    await saveBot(sessionId, error instanceof Error ? `Mã xác thực chưa dùng được: ${error.message}` : "Mã xác thực chưa đúng. Bạn kiểm tra rồi nhập lại nhé.");
  }

  return getSessionPayload(sessionId);
}

async function applyAuthResult(sessionId: string, state: SessionState, result: AuthResult) {
  if (result.status === "2fa") {
    state.twoFactor = {
      challengeToken: result.challengeToken,
      method: result.methods.includes("email_otp") && !result.methods.includes("google2fa") ? "email_otp" : "google2fa"
    };
    state.step = "two_factor";
    await updateSession(sessionId, state);
    return;
  }

  persistAuthSuccess(state, result);
  await updateSession(sessionId, state);
}

function persistAuthSuccess(state: SessionState, result: AuthSuccess) {
  const id = result.user.id ? String(result.user.id) : undefined;
  const email = typeof result.user.email === "string" ? result.user.email : state.email ?? state.register?.email;

  state.account = {
    id,
    email,
    name: typeof result.user.name === "string" ? result.user.name : state.register?.name,
    phone: typeof result.user.phone === "string" ? result.user.phone : state.register?.phone,
    balance: result.user.balance as number | string | undefined,
    token: encryptSecret(result.token),
    tokenType: result.tokenType,
    accountKey: id ?? email ?? randomUUID()
  };
  state.step = "ready_for_link";
  state.twoFactor = undefined;
  state.register = undefined;
}

async function handleProductLink(sessionId: string, text: string, state: SessionState) {
  const url = urlSchema.safeParse(text);
  if (!url.success) {
    await saveBot(sessionId, "Ry chưa nhận ra link sản phẩm. Bạn sao chép đầy đủ link Shopee hoặc TikTok Shop rồi gửi lại nhé.");
    return;
  }

  const account = accountWithToken(state.account!);
  const result = await createCashbackLink(url.data, account.token, account.tokenType, sessionId);
  if (!result.ok) {
    await saveBot(sessionId, result.error);
    return;
  }

  await saveBot(sessionId, formatCashbackResult(result.data, url.data));
}

function formatCashbackResult(data: CashbackLinkResult, sourceUrl = "") {
  return `CASHBACK_RESULT:${JSON.stringify({
    productName: data.productName ?? "Sản phẩm Shopee/TikTok Shop",
    affiliateUrl: data.affiliateUrl,
    cashbackAmount: data.cashbackAmount !== undefined && data.cashbackAmount !== null && data.cashbackAmount !== "" ? `${formatMoney(data.cashbackAmount)} VND` : "Đang cập nhật",
    productImage: data.productImage,
    platform: detectShoppingPlatform(sourceUrl || data.affiliateUrl),
    transId: data.transId
  })}`;
}

function detectShoppingPlatform(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("shopee") || normalized.includes("shp.ee")) return "shopee";
  return "shop";
}

function formatMoney(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "0");
  return new Intl.NumberFormat("vi-VN").format(number);
}

function formatStatus(value: unknown) {
  const status = String(value ?? "").toLowerCase();
  if (["approved", "success", "completed", "paid", "done"].includes(status)) return "Đã duyệt";
  if (["pending", "processing", "waiting", "created"].includes(status)) return "Đang xử lý";
  if (["rejected", "cancelled", "canceled", "failed", "denied"].includes(status)) return "Từ chối";
  return String(value ?? "Đang cập nhật");
}

function record(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function listFromData(data: Record<string, unknown>) {
  const items = data.items ?? data.data ?? data.notifications ?? data.withdrawals ?? data.orders;
  return Array.isArray(items) ? items.map(record) : [];
}

function parseItemDate(item: Record<string, unknown>) {
  const raw =
    item.created_at ??
    item.createdAt ??
    item.order_date ??
    item.orderDate ??
    item.tracked_at ??
    item.trackedAt ??
    item.updated_at ??
    item.updatedAt;
  if (!raw) return null;
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date;
}

function recentOrders(items: Record<string, unknown>[]) {
  const now = Date.now();
  const tenDays = 10 * 24 * 60 * 60 * 1000;
  const hasDate = items.some((item) => parseItemDate(item));
  if (!hasDate) return items;
  return items.filter((item) => {
    const date = parseItemDate(item);
    return date ? now - date.getTime() <= tenDays : false;
  });
}

function formatAccount(data: Record<string, unknown>) {
  const wallet = record(data.wallet);
  const stats = record(data.stats);
  return [
    "Tổng quan tài khoản:",
    `Email: ${data.email ?? "-"}`,
    `Họ tên: ${data.name ?? "-"}`,
    `Số dư ví: ${formatMoney(wallet.balance)} ${wallet.currency ?? "VND"}`,
    `Đơn đã duyệt: ${stats.orders_approved ?? stats.ordersApproved ?? 0}`,
    `Người giới thiệu: ${stats.referrals ?? stats.referrals_count ?? 0}`
  ].join("\n");
}

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
}

function formatDateTime(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatOrders(data: Record<string, unknown>, all = false) {
  const source = listFromData(data);
  const items = all ? source : recentOrders(source);
  const scope = all ? "toàn bộ đơn hàng" : "10 ngày gần đây";
  if (!items.length) return `Ry chưa tìm thấy đơn hàng phù hợp trong ${scope}.`;

  return [
    `Các đơn hàng trong ${scope}:`,
    ...items.map((item, index) =>
      [
        `${index + 1}. ${item.product_name ?? item.productName ?? item.order_id ?? "Đơn hàng"}`,
        `Ảnh sản phẩm: ${item.product_image ?? item.productImage ?? item.image_url ?? item.imageUrl ?? item.thumbnail ?? "-"}`,
        `Ngày đối soát: ${formatDate(item.reconciliation_date ?? item.reconciliationDate ?? item.approved_at ?? item.approvedAt ?? item.confirmed_at ?? item.confirmedAt) || "Chưa có"}`,
        `Tiền hoàn dự kiến: ${formatMoney(item.cashback_amount)} VND`,
        `Trạng thái: ${formatStatus(item.status)}`
      ].join("\n")
    ),
    all ? "ORDER_SCOPE:10" : "ORDER_SCOPE:ALL"
  ].join("\n\n");
}

function formatNotifications(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Bạn đã đọc hết thông báo rồi ạ.";

  return [
    "Thông báo chưa đọc:",
    ...items.map((item, index) => [
      `${index + 1}. ${item.title ?? item.subject ?? "Thông báo"}`,
      `ID: ${item.id ?? "-"}`,
      `Nội dung: ${item.message ?? item.content ?? ""}`,
      `Loại: ${item.type ?? item.category ?? "Hệ thống"}`,
      `Trạng thái đọc: ${item.is_read ?? item.isRead ? "Đã đọc" : "Chưa đọc"}`,
      `Thời gian: ${formatDateTime(item.created_at ?? item.createdAt) || "Mới cập nhật"}`
    ].join("\n")),
    "NOTIFICATION_ACTIONS:READ_ALL"
  ].join("\n\n");
}

function formatWithdrawals(data: Record<string, unknown>, fullHistory = false) {
  const items = listFromData(data);
  if (!items.length) return "Bạn chưa có lần rút tiền nào.";
  const pagination = record(data.pagination ?? data.meta);
  const currentPage = Number(pagination.current_page ?? pagination.currentPage ?? 1);
  const lastPage = Number(pagination.last_page ?? pagination.lastPage ?? currentPage);
  const total = Number(pagination.total ?? items.length);
  const navigation = fullHistory
    ? { mode: "full", currentPage, lastPage, total }
    : { mode: "summary", currentPage: 1, lastPage: 1, total };

  return [
    fullHistory ? "Toàn bộ lịch sử rút tiền:" : "2 lần rút tiền gần đây:",
    ...items.map((item, index) => [
      `${index + 1}. ${formatMoney(item.amount)} VND`,
      `Mã yêu cầu: ${item.code ?? item.id ?? "-"}`,
      `Trạng thái: ${formatStatus(item.status)}`,
      `Thực nhận: ${formatMoney(item.real_amount ?? item.realAmount ?? item.amount)} VND`,
      `Ngân hàng: ${item.bank_name ?? item.wallet_name ?? "-"}`,
      `Ngày tạo: ${formatDate(item.created_at ?? item.createdAt) || "Chưa có"}`,
      ...(item.notes ? [`Ghi chú: ${item.notes}`] : [])
    ].join("\n")),
    `WITHDRAWAL_NAV:${JSON.stringify(navigation)}`
  ].join("\n\n");
}

function formatGenericSuccess(data: Record<string, unknown>, fallback: string) {
  return String(data.message ?? data.status_message ?? fallback);
}

function formatTasks(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Hiện chưa có nhiệm vụ mới. Khi có, Ry sẽ hiển thị tại đây nhé.";
  return [
    "Nhiệm vụ nhận thưởng:",
    ...items.map((item, index) => [
      `${index + 1}. ${item.title ?? item.name ?? "Nhiệm vụ"}`,
      `ID: ${item.id ?? "-"}`,
      `Mô tả: ${item.description ?? item.content ?? ""}`,
      ...(item.guide ? [`Hướng dẫn: ${item.guide}`] : []),
      `Loại nhiệm vụ: ${item.type_label ?? item.type ?? "-"}`,
      `Cần thực hiện: ${item.action_label ?? item.action ?? "-"}`,
      `Tiến độ: ${item.progress ?? 0}/${item.target_count ?? item.target ?? "-"} (${item.percent ?? 0}%)`,
      `Thưởng: ${formatMoney(item.reward_amount ?? item.reward)} VND`,
      `Trạng thái: ${formatStatus(item.status)}`,
      ...(item.start_at ? [`Bắt đầu: ${formatDate(item.start_at)}`] : []),
      ...(item.end_at ? [`Kết thúc: ${formatDate(item.end_at)}`] : [])
    ].join("\n"))
  ].join("\n\n");
}

function formatReferrals(data: Record<string, unknown>) {
  const stats = record(data.stats);
  return [
    "Giới thiệu cho bạn bè:",
    `Mã giới thiệu: ${data.referral_code ?? "-"}`,
    `Link giới thiệu: ${data.referral_link ?? "-"}`,
    `Thành viên F1: ${stats.f1_count ?? 0}`,
    `Thành viên F2: ${stats.f2_count ?? 0}`,
    `Tổng hoa hồng: ${formatMoney(stats.total_commission)} VND`,
    "Chính sách hiện tại: F1 20%, F2 10% trên mức hoa hồng đủ điều kiện."
  ].join("\n");
}

function formatBalanceLogs(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Ví của bạn chưa có giao dịch nào.";
  return ["Biến động số dư:", ...items.map((item, index) => `${index + 1}. ${item.description ?? item.content ?? item.type ?? "Giao dịch"}\nSố tiền: ${item.is_credit === false ? "-" : "+"}${formatMoney(item.amount_change ?? item.amount)} VND\nSố dư sau giao dịch: ${formatMoney(item.amount_after)} VND`)].join("\n\n");
}

function formatActivityLogs(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Ry chưa thấy hoạt động nào gần đây trên tài khoản.";
  return ["Nhật ký hoạt động:", ...items.map((item, index) => `${index + 1}. ${item.activity ?? item.description ?? "Hoạt động tài khoản"}\nThời gian: ${item.created_at ?? item.createdAt ?? "-"}\nIP: ${item.ip_address ?? "-"}`)].join("\n\n");
}

function formatSecurity(data: Record<string, unknown>) {
  return [
    "Trạng thái bảo mật:",
    `Google Authenticator (2FA): ${data.two_factor_enabled ?? data.google2fa_enabled ?? data.two_fa_enabled ? "Đang bật" : "Đang tắt"}`,
    `OTP qua email: ${data.email_otp_enabled ? "Đang bật" : "Đang tắt"}`,
    "Bạn có thể quản lý chi tiết trong trang tài khoản tại hoantienmuahang.vn."
  ].join("\n");
}

function formatSessions(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Không tìm thấy phiên đăng nhập nào.";
  return [
    "Các phiên đăng nhập:",
    ...items.map((item, index) => `${index + 1}. ${item.device_name ?? "Thiết bị"}${item.is_current ? " (hiện tại)" : ""}\nID: ${item.id ?? "-"}\nIP gần nhất: ${item.last_ip ?? "-"}\nHoạt động: ${item.last_used_at ?? item.created_at ?? "-"}`),
    "Dùng /phien revoke ID để thu hồi một phiên khác hoặc /phien revoke-others để đăng xuất tất cả thiết bị khác."
  ].join("\n\n");
}

function parseOrderQuery(text: string) {
  const parts = text.trim().split(/\s+/).slice(1);
  const query: { status?: string; platform?: string; search?: string; page?: number; per_page?: number } = {};
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (!value) return;
    if (key === "status" || key === "platform" || key === "search") query[key] = value;
    if (key === "page" || key === "per_page") query[key] = Number(value);
  });
  return query;
}

function isAllOrderRequest(text: string) {
  const normalized = normalizeVietnamese(text);
  return /\b(all|tat ca|toan bo|het)\b/.test(normalized);
}

function parseProfileCommand(text: string) {
  const raw = text.replace(/^\/capnhat\s*/i, "");
  const [name, phone] = raw.split("|").map((item) => item.trim());
  if (!name && !phone) return null;
  return { name, phone };
}

function parsePasswordCommand(text: string) {
  const raw = text.replace(/^\/doimatkhau\s*/i, "");
  const [current_password, password, password_confirmation] = raw.split("|").map((item) => item.trim());
  if (!current_password || !password || !password_confirmation) return null;
  return { current_password, password, password_confirmation };
}

function parseWithdrawalCommand(text: string) {
  const raw = text.replace(/^\/ruttien\s*/i, "");
  const separator = raw.includes("|") ? "|" : "_";
  const parts = raw.split(separator).map((item) => item.trim());
  const [amountRaw, payment_method, bankOrWalletName, account_number] = parts;
  const account_name = separator === "|" ? parts[4] : parts.slice(4).join(separator).trim();
  const otp_code = separator === "|" && parts.length > 5 ? parts[5] : undefined;
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 10000 || !payment_method || !account_number || !account_name) return null;

  return {
    amount,
    payment_method,
    ...(payment_method === "wallet" || payment_method === "momo" ? { wallet_name: bankOrWalletName } : { bank_name: bankOrWalletName }),
    account_number,
    account_name,
    otp_code: otp_code || undefined
  };
}

function isWithdrawalOtpRequest(text: string) {
  const raw = text.replace(/^\/ruttien\s*/i, "").trim().toLowerCase();
  return ["otp", "gui otp", "gửi otp", "ma otp", "mã otp"].includes(raw);
}

function withdrawalGuide() {
  return [
    "Hướng dẫn rút tiền:",
    "Mình sẽ hỏi lần lượt 4 thông tin:",
    "1. Số tiền",
    "2. Ngân hàng",
    "3. Số tài khoản",
    "4. Chủ tài khoản",
    "",
    "Bắt đầu: vui lòng nhập số tiền muốn rút, lớn hơn 10.000 VND. Ví dụ: 50000",
    "",
    "Muốn gửi nhanh có thể dùng:",
    "/ruttien 50000_bank_Techcombank_190123_NGUYEN VAN A"
  ].join("\n");
}
