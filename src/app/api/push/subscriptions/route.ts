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

export async function GET(request: NextRequest) {
  if (!checkLimit(request)) return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "Thiếu sessionId." }, { status: 400 });
    await requireMatchingChatSession(request, sessionId);
    const account = await getOpenApiAccountForSession(sessionId);
    const subscriptions = await prisma.webPushSubscription.findMany({
      where: { accountKey: account.accountKey, isAdmin: false },
      select: { id: true, endpoint: true, enabled: true, quietStart: true, quietEnd: true, timezone: true, categories: true, userAgent: true, updatedAt: true }
    });
    return NextResponse.json({ subscriptions });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tải thiết bị." }, { status: 400 });
  }
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
        userAgent: request.headers.get("user-agent")?.slice(0, 500),
        enabled: true,
        isAdmin: false,
        lastSeenAt: new Date()
      },
      update: {
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        accountKey: account.accountKey,
        userAgent: request.headers.get("user-agent")?.slice(0, 500),
        enabled: true,
        isAdmin: false,
        lastSeenAt: new Date()
      }
    });
    return NextResponse.json({ success: true, id: subscription.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu thiết bị." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkLimit(request)) return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });
  try {
    const body = z.object({
      sessionId: z.string().min(1),
      endpoint: z.string().url(),
      enabled: z.boolean().optional(),
      quietStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      quietEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      timezone: z.string().min(1).max(100).optional(),
      categories: z.array(z.enum(["REMINDER", "ORDER", "CASHBACK", "SUPPORT"])).min(1).optional()
    }).parse(await request.json());
    await requireMatchingChatSession(request, body.sessionId);
    const account = await getOpenApiAccountForSession(body.sessionId);
    const updated = await prisma.webPushSubscription.updateMany({
      where: { endpoint: body.endpoint, accountKey: account.accountKey },
      data: {
        enabled: body.enabled,
        quietStart: body.quietStart,
        quietEnd: body.quietEnd,
        timezone: body.timezone,
        categories: body.categories ? JSON.stringify(body.categories) : undefined
      }
    });
    if (!updated.count) return NextResponse.json({ error: "Không tìm thấy thiết bị." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật thiết bị." }, { status: 400 });
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
