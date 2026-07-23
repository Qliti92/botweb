import { NextRequest, NextResponse } from "next/server";
import { getUserChatHistory } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { requireMatchingChatSession } from "@/lib/chat-session";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-history:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId." }, { status: 400 });
    }
    await requireMatchingChatSession(request, sessionId);

    return NextResponse.json({ history: await getUserChatHistory(sessionId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tải lịch sử chat." }, { status: 400 });
  }
}
