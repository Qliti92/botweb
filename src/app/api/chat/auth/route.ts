import { NextResponse } from "next/server";
import { z } from "zod";
import { completeChatSessionTwoFactor, forgotChatPassword, loginChatSession, registerChatSession } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";

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
    referralCode: z.string().trim().optional()
  }),
  z.object({
    mode: z.literal("forgot"),
    email: z.string().trim().toLowerCase().email()
  }),
  z.object({
    mode: z.literal("2fa"),
    sessionId: z.string().min(1),
    code: z.string().trim().min(4)
  })
]);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-auth:${ip}`, 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const body = authSchema.parse(await request.json());
    if (body.mode === "login") return NextResponse.json(await loginChatSession(body.email, body.password));
    if (body.mode === "register") return NextResponse.json(await registerChatSession(body));
    if (body.mode === "2fa") return NextResponse.json(await completeChatSessionTwoFactor(body.sessionId, body.code));

    return NextResponse.json({ message: await forgotChatPassword(body.email) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể xác thực." }, { status: 400 });
  }
}
