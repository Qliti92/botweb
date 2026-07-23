import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().min(20).max(1000), auth: z.string().min(8).max(500) })
});

export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const subscription = schema.parse(await request.json());
    const saved = await prisma.webPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isAdmin: true,
        userAgent: request.headers.get("user-agent")?.slice(0, 500)
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enabled: true,
        isAdmin: true,
        lastSeenAt: new Date(),
        userAgent: request.headers.get("user-agent")?.slice(0, 500)
      }
    });
    return NextResponse.json({ success: true, id: saved.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể đăng ký thiết bị admin." }, { status: 400 });
  }
}
