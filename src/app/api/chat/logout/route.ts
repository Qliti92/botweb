import { NextRequest, NextResponse } from "next/server";
import { logoutChatSession } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { requireMatchingChatSession, setChatSessionCookie } from "@/lib/chat-session";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-logout:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { sessionId?: string };
    if (!body.sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId." }, { status: 400 });
    }
    await requireMatchingChatSession(request, body.sessionId);
    const session = await logoutChatSession(body.sessionId);
    return setChatSessionCookie(NextResponse.json(session), session.id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể đăng xuất." }, { status: 400 });
  }
}
