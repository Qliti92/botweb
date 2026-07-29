import { NextRequest, NextResponse } from "next/server";
import { createChatSession, restoreChatSession } from "@/services/conversation";
import { rateLimit } from "@/lib/rate-limit";
import { readChatSessionId, setChatSessionCookie } from "@/lib/chat-session";
import { resolveReferralDomain } from "@/services/referral-domain";
import { prisma } from "@/lib/prisma";

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

    const currentSessionId = await readChatSessionId(request);
    if (!currentSessionId) {
      return NextResponse.json({ error: "Phiên chat không hợp lệ hoặc đã hết hạn." }, { status: 401 });
    }

    if (currentSessionId !== sessionId) {
      const [current, requested] = await Promise.all([
        prisma.chatSession.findUnique({ where: { id: currentSessionId }, select: { state: true } }),
        prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } })
      ]);
      const currentAccountKey = readAccountKey(current?.state);
      const requestedAccountKey = readAccountKey(requested?.state);
      if (!currentAccountKey || !requestedAccountKey || currentAccountKey !== requestedAccountKey) {
        return NextResponse.json({ error: "Bạn không có quyền mở phiên chat này." }, { status: 403 });
      }
    }

    const payload = await restoreChatSession(sessionId);
    return setChatSessionCookie(NextResponse.json(payload), sessionId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể khôi phục phiên chat." }, { status: 404 });
  }
}

function readAccountKey(raw?: string) {
  try {
    const state = JSON.parse(raw || "{}") as { account?: { accountKey?: string } };
    return state.account?.accountKey?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-session-create:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn tạo phiên chat quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
  }

  try {
    const session = await createChatSession(await resolveReferralDomain(request));
    return setChatSessionCookie(NextResponse.json(session), session.id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo phiên chat." }, { status: 500 });
  }
}
