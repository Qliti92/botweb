import { NextRequest, NextResponse } from "next/server";
import { chatMessageSchema } from "@/lib/validators";
import { handleUserMessage } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { requireMatchingChatSession } from "@/lib/chat-session";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-message:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn gửi tin nhắn quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const body = chatMessageSchema.parse(await request.json());
    if (!body.sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId." }, { status: 400 });
    }
    await requireMatchingChatSession(request, body.sessionId);
    return NextResponse.json(await handleUserMessage(body.sessionId, body.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể gửi tin nhắn.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
