import { NextRequest, NextResponse } from "next/server";
import { getNotificationSnapshot } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { requireMatchingChatSession } from "@/lib/chat-session";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-notifications:${ip}`, 90, 60_000);
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

    return NextResponse.json(await getNotificationSnapshot(sessionId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể kiểm tra thông báo." }, { status: 400 });
  }
}
