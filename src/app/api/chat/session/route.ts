import { NextResponse } from "next/server";
import { createChatSession, restoreChatSession } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
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

    return NextResponse.json(await restoreChatSession(sessionId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể khôi phục phiên chat." }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-session-create:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn tạo phiên chat quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    return NextResponse.json(await createChatSession());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo phiên chat." }, { status: 500 });
  }
}
