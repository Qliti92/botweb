import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { emailSchema, passwordSchema, phoneSchema, urlSchema } from "@/lib/validators";
import { createCashbackLink, type CashbackLinkResult } from "@/services/cashback-link";
import { completeOpenApi2fa, loginWithOpenApi, registerWithOpenApi, type AuthResult, type AuthSuccess } from "@/services/openapi-auth";
import {
  changePassword,
  createWithdrawal,
  deleteAccount,
  getAccount,
  getNotifications,
  getOrders,
  getUnreadNotificationCount,
  getWithdrawals,
  markAllNotificationsRead,
  sendWithdrawalOtp,
  updateProfile
} from "@/services/openapi-member";

type SessionState = {
  step?: string;
  email?: string;
  register?: {
    email?: string;
    name?: string;
    phone?: string;
    password?: string;
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
};

const startMessage = "Nếu bạn có tài khoản chọn 1\nChưa có tài khoản chọn 2";
const readyMessage = "Bạn đã đăng nhập thành công. Hãy dán link sản phẩm Shopee hoặc TikTok Shop để tạo link hoàn tiền.";

const guideMessage = [
  "Hướng dẫn sử dụng:",
  "1. Đăng nhập hoặc đăng ký tài khoản.",
  "2. Dán link sản phẩm Shopee hoặc TikTok Shop vào ô chat.",
  "3. Bấm nút đỏ trong kết quả để quay lại sàn mua hàng.",
  "4. Khi mua hàng, hãy để giỏ hàng trống và ấn 2 lần link để bảo đảm chuyển đổi.",
  "",
  "Lệnh nhanh:",
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
  "/xoachat - xóa nội dung chat hiện tại"
].join("\n");

const supportMessage = [
  "Hỗ trợ khách hàng:",
  "Điện thoại: 0375823061",
  "Zalo: https://zalo.me/g/5lqqyvfhem7kgbrjxk7k",
  "Email: hotro@hoantienmuahang.vn",
  "Trang chính thức: https://hoantienmuahang.vn",
  "Thời gian hỗ trợ: 8h - 20h hằng ngày"
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

function isMemberCommand(value: string) {
  const command = normalize(value).split(/\s+/, 1)[0];
  return [
    "/taikhoan",
    "/sodu",
    "/donhang",
    "/thongbao",
    "/doctatca",
    "/lichsurut",
    "/ruttien",
    "/capnhat",
    "/doimatkhau",
    "/xoataikhoan"
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

  await prisma.chatMessage.create({ data: { sessionId, sender: "USER", content } });
  const state = readState(session.state);
  const text = content.trim();

  if (isGuideCommand(text)) {
    await saveBot(sessionId, guideMessage);
    return getSessionPayload(sessionId);
  }

  if (isSupportCommand(text)) {
    await saveBot(sessionId, supportMessage);
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
    await saveBot(sessionId, "Đã hủy thao tác rút tiền hiện tại để chuyển sang lệnh mới.");
  } else if (state.account && state.step?.startsWith("withdrawal_")) {
    await handleWithdrawalStep(sessionId, text, state);
    return getSessionPayload(sessionId);
  }

  if (!state.account && isMemberCommand(text)) {
    await saveBot(sessionId, `Bạn cần đăng nhập để dùng lệnh này.\n${startMessage}`);
    return getSessionPayload(sessionId);
  }

  if (state.account && isMemberCommand(text)) {
    await handleMemberCommand(sessionId, text, state);
    return getSessionPayload(sessionId);
  }

  if (state.account) {
    await handleProductLink(sessionId, text, state);
    return getSessionPayload(sessionId);
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
      await saveBot(sessionId, "Vui lòng nhập số điện thoại.");
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
  await saveBot(sessionId, state.account ? `Đã xóa nội dung chat.\n${readyMessage}` : `Đã xóa nội dung chat.\n${startMessage}`);
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
      await saveBot(sessionId, formatOrders(await getOrders(account.token, account.tokenType, parseOrderQuery(text))));
      return;
    }

    if (command === "/thongbao") {
      await saveBot(sessionId, formatNotifications(await getNotifications(account.token, account.tokenType, { filter: "unread" })));
      return;
    }

    if (command === "/doctatca") {
      await markAllNotificationsRead(account.token, account.tokenType);
      await saveBot(sessionId, "Đã đánh dấu tất cả thông báo là đã đọc.");
      return;
    }

    if (command === "/lichsurut") {
      await saveBot(sessionId, formatWithdrawals(await getWithdrawals(account.token, account.tokenType)));
      return;
    }

    if (command === "/ruttien") {
      if (isWithdrawalOtpRequest(text)) {
        await sendWithdrawalOtp(account.token, account.tokenType);
        await saveBot(sessionId, "Đã gửi mã OTP rút tiền về email của bạn.");
        return;
      }

      const payload = parseWithdrawalCommand(text);
      if (!payload) {
        state.step = "withdrawal_amount";
        state.withdrawalDraft = {};
        await updateSession(sessionId, state);
        await saveBot(sessionId, withdrawalGuide());
        return;
      }
      await saveBot(sessionId, formatGenericSuccess(await createWithdrawal(account.token, account.tokenType, payload), "Đã tạo yêu cầu rút tiền."));
      return;
    }

    if (command === "/capnhat") {
      const payload = parseProfileCommand(text);
      if (!payload) {
        await saveBot(sessionId, "Cú pháp: /capnhat Họ tên|Số điện thoại");
        return;
      }
      await saveBot(sessionId, formatGenericSuccess(await updateProfile(account.token, account.tokenType, payload), "Đã cập nhật hồ sơ."));
      return;
    }

    if (command === "/doimatkhau") {
      const payload = parsePasswordCommand(text);
      if (!payload) {
        await saveBot(sessionId, "Cú pháp: /doimatkhau mật_khẩu_hiện_tại|mật_khẩu_mới|nhập_lại_mật_khẩu_mới");
        return;
      }
      await saveBot(sessionId, formatGenericSuccess(await changePassword(account.token, account.tokenType, payload), "Đã đổi mật khẩu."));
      return;
    }

    if (command === "/xoataikhoan") {
      await deleteAccount(account.token, account.tokenType);
      await saveBot(sessionId, "Đã gửi yêu cầu xóa tài khoản.");
      return;
    }
  } catch (error) {
    await saveBot(sessionId, error instanceof Error ? error.message : "Không thể xử lý yêu cầu này.");
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
    await saveBot(sessionId, "Đã hủy yêu cầu rút tiền.");
    return;
  }

  if (state.step === "withdrawal_amount") {
    const amount = Number(text.replace(/[^\d]/g, ""));
    if (!Number.isFinite(amount) || amount <= 10000) {
      await saveBot(sessionId, "Số tiền rút phải lớn hơn 10.000 VND. Ví dụ: 50000");
      return;
    }
    state.withdrawalDraft = { ...draft, amount };
    state.step = "withdrawal_bank";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Nhập tên ngân hàng nhận tiền. Ví dụ: Techcombank");
    return;
  }

  if (state.step === "withdrawal_bank") {
    state.withdrawalDraft = { ...draft, bank_name: text };
    state.step = "withdrawal_account_number";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Nhập số tài khoản nhận tiền.");
    return;
  }

  if (state.step === "withdrawal_account_number") {
    state.withdrawalDraft = { ...draft, account_number: text };
    state.step = "withdrawal_account_name";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Nhập tên chủ tài khoản.");
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
        "Xác nhận rút tiền:",
        `Số tiền: ${formatMoney(nextDraft.amount)} VND`,
        `Ngân hàng: ${nextDraft.bank_name}`,
        `Số tài khoản: ${nextDraft.account_number}`,
        `Chủ tài khoản: ${nextDraft.account_name}`,
        "",
        "Vui lòng kiểm tra thật kỹ thông tin nhận tiền. Chúng tôi không chịu trách nhiệm nếu bạn nhập sai thông tin.",
        "Gõ 1 để đồng ý gửi yêu cầu, hoặc 2 để hủy."
      ].join("\n")
    );
    return;
  }

  if (state.step === "withdrawal_confirm") {
    if (normalized === "2") {
      state.step = "ready_for_link";
      state.withdrawalDraft = undefined;
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Đã hủy yêu cầu rút tiền.");
      return;
    }

    if (!["1", "xac nhan", "xác nhận", "confirm"].includes(normalized)) {
      await saveBot(sessionId, "Vui lòng gõ 1 để đồng ý gửi yêu cầu rút tiền, hoặc 2 để hủy.");
      return;
    }

    if (!draft.amount || !draft.bank_name || !draft.account_number || !draft.account_name) {
      state.step = "withdrawal_amount";
      state.withdrawalDraft = {};
      await updateSession(sessionId, state);
      await saveBot(sessionId, "Thông tin rút tiền chưa đủ. Vui lòng nhập lại số tiền muốn rút.");
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
      await saveBot(sessionId, error instanceof Error ? error.message : "Không thể tạo yêu cầu rút tiền.");
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
  await saveBot(sessionId, "Chọn 1 để đăng nhập, hoặc 2 để đăng ký tài khoản mới.");
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
  await saveBot(sessionId, "Vui lòng nhập mật khẩu để đăng nhập.");
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
  await saveBot(sessionId, "Vui lòng nhập họ tên.");
  return getSessionPayload(sessionId);
}

async function handleAuthChoice(sessionId: string, text: string, state: SessionState) {
  if (isLoginChoice(text)) {
    state.step = "login_email";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Vui lòng nhập email đăng nhập.");
    return getSessionPayload(sessionId);
  }

  if (isRegisterChoice(text)) {
    state.register = {};
    state.step = "register_email";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Vui lòng nhập email đăng ký.");
    return getSessionPayload(sessionId);
  }

  await saveBot(sessionId, startMessage);
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
    await saveBot(sessionId, error instanceof Error ? error.message : "Không thể đăng nhập, vui lòng thử lại.");
  }

  return getSessionPayload(sessionId);
}

async function handleRegisterPhone(sessionId: string, text: string, state: SessionState) {
  const phone = phoneSchema.safeParse(text);
  if (!phone.success) {
    await saveBot(sessionId, phone.error.issues[0]?.message ?? "Số điện thoại không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.register = { ...state.register, phone: phone.data };
  state.step = "register_password";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Vui lòng nhập mật khẩu.");
  return getSessionPayload(sessionId);
}

async function handleRegisterPasswordStep(sessionId: string, text: string, state: SessionState) {
  const password = passwordSchema.safeParse(text);
  if (!password.success) {
    await saveBot(sessionId, password.error.issues[0]?.message ?? "Mật khẩu không hợp lệ.");
    return getSessionPayload(sessionId);
  }

  state.register = { ...state.register, password: password.data };
  state.step = "register_password_confirmation";
  await updateSession(sessionId, state);
  await saveBot(sessionId, "Vui lòng nhập lại mật khẩu để xác nhận.");
  return getSessionPayload(sessionId);
}

async function handleRegisterPasswordConfirmation(sessionId: string, text: string, state: SessionState) {
  const register = state.register;
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
        email: register.email,
        password: register.password,
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

async function handleTwoFactor(sessionId: string, text: string, state: SessionState) {
  if (!state.twoFactor?.challengeToken) {
    state.step = "login_password";
    await updateSession(sessionId, state);
    await saveBot(sessionId, "Phiên 2FA đã hết hạn. Vui lòng nhập lại mật khẩu.");
    return getSessionPayload(sessionId);
  }

  try {
    await applyAuthResult(sessionId, state, await completeOpenApi2fa(state.twoFactor.challengeToken, text, state.twoFactor.method));
  } catch (error) {
    await saveBot(sessionId, error instanceof Error ? error.message : "Mã xác thực chưa đúng, vui lòng thử lại.");
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
    await saveBot(sessionId, `${result.message}\nVui lòng nhập mã ${state.twoFactor.method === "email_otp" ? "OTP email" : "Google Authenticator"}.`);
    return;
  }

  persistAuthSuccess(state, result);
  await updateSession(sessionId, state);
  await saveBot(sessionId, result.message);
  await saveBot(sessionId, readyMessage);
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
    await saveBot(sessionId, "Vui lòng gửi link sản phẩm Shopee hoặc TikTok Shop hợp lệ.");
    return;
  }

  const account = accountWithToken(state.account!);
  const result = await createCashbackLink(url.data, account.token, account.tokenType, sessionId);
  if (!result.ok) {
    await saveBot(sessionId, result.error);
    return;
  }

  await saveBot(sessionId, formatCashbackResult(result.data));
}

function formatCashbackResult(data: CashbackLinkResult) {
  return `CASHBACK_RESULT:${JSON.stringify({
    productName: data.productName ?? "Sản phẩm Shopee/TikTok Shop",
    affiliateUrl: data.affiliateUrl,
    cashbackAmount: data.cashbackAmount !== undefined && data.cashbackAmount !== null && data.cashbackAmount !== "" ? `${formatMoney(data.cashbackAmount)} VND` : "Đang cập nhật",
    transId: data.transId
  })}`;
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
    "Thông tin tài khoản:",
    `Email: ${data.email ?? "-"}`,
    `Họ tên: ${data.name ?? "-"}`,
    `Số dư ví: ${formatMoney(wallet.balance)} ${wallet.currency ?? "VND"}`,
    `Đơn đã duyệt: ${stats.orders_approved ?? stats.ordersApproved ?? 0}`,
    `Người giới thiệu: ${stats.referrals ?? stats.referrals_count ?? 0}`
  ].join("\n");
}

function formatOrders(data: Record<string, unknown>) {
  const items = recentOrders(listFromData(data));
  if (!items.length) return "Chưa có đơn hàng phù hợp.";

  return [
    "Đơn hàng 10 ngày gần đây:",
    ...items.map((item, index) =>
      [
        `${index + 1}. ${item.product_name ?? item.productName ?? item.order_id ?? "Đơn hàng"}`,
        `Tiền hoàn dự kiến: ${formatMoney(item.cashback_amount)} VND`,
        `Trạng thái: ${formatStatus(item.status)}`
      ].join("\n")
    )
  ].join("\n\n");
}

function formatNotifications(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Bạn chưa có thông báo chưa đọc.";

  return [
    "Thông báo chưa đọc:",
    ...items.map((item, index) => `${index + 1}. ${item.title ?? item.subject ?? "Thông báo"}\n${item.message ?? item.content ?? ""}`)
  ].join("\n\n");
}

function formatWithdrawals(data: Record<string, unknown>) {
  const items = listFromData(data);
  if (!items.length) return "Chưa có lịch sử rút tiền.";

  return [
    "Lịch sử rút tiền:",
    ...items.map((item, index) => `${index + 1}. ${formatMoney(item.amount)} VND\nTrạng thái: ${formatStatus(item.status)}\nNgân hàng: ${item.bank_name ?? item.wallet_name ?? item.payment_method ?? "-"}`)
  ].join("\n\n");
}

function formatGenericSuccess(data: Record<string, unknown>, fallback: string) {
  return String(data.message ?? data.status_message ?? fallback);
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
