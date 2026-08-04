import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completeChatSessionEmailVerification, completeChatSessionTwoFactor, forgotChatPassword, loginChatSession, registerChatSession } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { requireMatchingChatSession, setChatSessionCookie } from "@/lib/chat-session";
import { resolveReferralDomain } from "@/services/referral-domain";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { AuthServiceError } from "@/services/openapi-auth";

const authSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("login"),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1)
  }),
  z.object({
    mode: z.literal("register"),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
    passwordConfirmation: z.string().min(8),
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    referralCode: z.string().trim().optional(),
    registrationPath: z.string().trim().max(300).optional(),
    registrationContext: z.enum(["MAIN_REGISTER", "LINK_REGISTER"]).optional(),
    registrationAttemptId: z.string().trim().max(80).optional()
  }),
  z.object({
    mode: z.literal("forgot"),
    email: z.string().trim().toLowerCase().email()
  }),
  z.object({
    mode: z.literal("2fa"),
    sessionId: z.string().min(1),
    code: z.string().trim().min(4)
  }),
  z.object({
    mode: z.literal("verify-email"),
    sessionId: z.string().min(1),
    code: z.string().trim().min(4)
  })
]);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-auth:${ip}`, 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const body = authSchema.parse(await request.json());
    if (body.mode === "login") {
      const session = await loginChatSession(body.email, body.password);
      return setChatSessionCookie(NextResponse.json(session), session.id);
    }
    if (body.mode === "register") {
      const fixedReferral = await resolveReferralDomain(request);
      const session = await registerChatSession({
        ...body,
        referralCode: fixedReferral?.referralCode ?? body.referralCode,
        referralDomain: fixedReferral?.domain
      });
      const visitorId = request.cookies.get("qbot_vid")?.value;
      if (visitorId) {
        const latestVisit = await prisma.auditLog.findFirst({
          where: { actorId: visitorId, action: "PAGE_VISIT" },
          orderBy: { createdAt: "desc" },
          select: { metadata: true }
        });
        let visitMetadata: Record<string, unknown> = {};
        try { visitMetadata = JSON.parse(latestVisit?.metadata || "{}") as Record<string, unknown>; } catch {}
        const userAgent = request.headers.get("user-agent") || "";
        await writeAuditLog({
          actorType: "USER",
          actorId: visitorId,
          action: "WEB_REGISTRATION_COMPLETED",
          targetType: "ChatSession",
          targetId: session.id,
          metadata: {
            path: body.registrationPath || "/",
            source: String(visitMetadata.source || "Trực tiếp"),
            device: /iphone|ipad|ipod/i.test(userAgent) ? "iPhone/iPad" : /android/i.test(userAgent) ? "Android" : "Máy tính",
            context: body.registrationContext || "MAIN_REGISTER",
            attemptId: body.registrationAttemptId,
            inputSnapshot: registrationInputSnapshot(body),
            apiResponse: JSON.stringify({ success: true, userCreated: true, sessionCreated: true })
          }
        });
      }
      return setChatSessionCookie(NextResponse.json(session), session.id);
    }
    if (body.mode === "2fa") {
      await requireMatchingChatSession(request, body.sessionId);
      const session = await completeChatSessionTwoFactor(body.sessionId, body.code);
      return setChatSessionCookie(NextResponse.json(session), session.id);
    }
    if (body.mode === "verify-email") {
      await requireMatchingChatSession(request, body.sessionId);
      const session = await completeChatSessionEmailVerification(body.sessionId, body.code);
      return setChatSessionCookie(NextResponse.json(session), session.id);
    }

    return NextResponse.json({ message: await forgotChatPassword(body.email) });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Dữ liệu gửi lên không đúng định dạng." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      const field = String(first?.path[0] ?? "");
      const messages: Record<string, string> = {
        mode: "Yêu cầu xác thực không hợp lệ.",
        email: "Bạn kiểm tra lại địa chỉ email.",
        password: "Mật khẩu cần có ít nhất 8 ký tự.",
        passwordConfirmation: "Mật khẩu xác nhận cần có ít nhất 8 ký tự.",
        code: "Mã xác thực chưa hợp lệ.",
        sessionId: "Phiên xác thực không hợp lệ hoặc đã hết hạn."
      };
      return NextResponse.json({ error: messages[field] ?? first?.message ?? "Thông tin xác thực chưa hợp lệ." }, { status: 400 });
    }
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể xác thực." }, { status: 400 });
  }
}
function registrationInputSnapshot(body: { email?: string; name?: string; phone?: string; referralCode?: string }) {
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.replace(/\D/g, "");
  return {
    email: email || undefined,
    name: body.name?.trim() || undefined,
    phone: phone ? `${"*".repeat(Math.max(0, phone.length - 3))}${phone.slice(-3)}` : undefined,
    referralCode: body.referralCode?.trim() || undefined
  };
}
