import { NextRequest, NextResponse } from "next/server";
import { createChatSession, restoreChatSession } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { requireMatchingChatSession, setChatSessionCookie } from "@/lib/chat-session";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-session-get:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId." }, { status: 400 });
    }

    await requireMatchingChatSession(request, sessionId);
    return NextResponse.json(await restoreChatSession(sessionId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể khôi phục phiên chat." }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-session-create:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn tạo phiên chat quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const session = await createChatSession();
    return setChatSessionCookie(NextResponse.json(session), session.id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo phiên chat." }, { status: 500 });
  }
}
