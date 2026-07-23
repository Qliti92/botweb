import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { rateLimit } from "@/lib/rate-limit";
import { getOpenApiAccountForSession } from "@/services/conversation";

const schema = z.object({
  sessionId: z.string().min(1),
  subscription: z.object({
    endpoint: z.string().url().max(2000),
    keys: z.object({
      p256dh: z.string().min(20).max(1000),
      auth: z.string().min(8).max(500)
    })
  })
});

function checkLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  return rateLimit(`push-subscription:${ip}`, 30, 60_000).ok;
}

export async function POST(request: NextRequest) {
  if (!checkLimit(request)) return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });
  try {
    const body = schema.parse(await request.json());
    await requireMatchingChatSession(request, body.sessionId);
    const account = await getOpenApiAccountForSession(body.sessionId);
    const subscription = await prisma.webPushSubscription.upsert({
      where: { endpoint: body.subscription.endpoint },
      create: {
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        accountKey: account.accountKey,
        userAgent: request.headers.get("user-agent")?.slice(0, 500)
      },
      update: {
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        accountKey: account.accountKey,
        userAgent: request.headers.get("user-agent")?.slice(0, 500)
      }
    });
    return NextResponse.json({ success: true, id: subscription.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu thiết bị." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkLimit(request)) return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });
  try {
    const body = z.object({ sessionId: z.string().min(1), endpoint: z.string().url() }).parse(await request.json());
    await requireMatchingChatSession(request, body.sessionId);
    await prisma.webPushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể hủy thiết bị." }, { status: 400 });
  }
}
