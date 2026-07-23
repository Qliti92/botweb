import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { ensureDefaultPushCampaigns, sendPush } from "@/services/web-push";

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(1000),
  actionUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  scheduledAt: z.coerce.date(),
  recurrence: z.enum(["ONCE", "DAILY"]),
  segment: z.enum(["ALL", "ADMIN", "INACTIVE_3D", "ACCOUNT"]).default("ALL"),
  category: z.enum(["REMINDER", "ORDER", "CASHBACK", "SUPPORT"]).default("REMINDER"),
  targetAccountKey: z.string().trim().optional().nullable(),
  maxPerDay: z.coerce.number().int().min(1).max(5).default(2)
});

export async function GET() {
  await requireAdmin();
  await ensureDefaultPushCampaigns();
  const [campaigns, subscriptions, adminSubscriptions, deliveries, lastCronRun] = await Promise.all([
    prisma.pushCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.webPushSubscription.count({ where: { enabled: true, isAdmin: false } }),
    prisma.webPushSubscription.count({ where: { enabled: true, isAdmin: true } }),
    prisma.pushDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.pushCronRun.findFirst({ orderBy: { startedAt: "desc" } })
  ]);
  return NextResponse.json({ campaigns, subscriptionCount: subscriptions, adminSubscriptionCount: adminSubscriptions, deliveries, lastCronRun });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const body = createSchema.parse(await request.json());
    const campaign = await prisma.pushCampaign.create({
      data: {
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl || null,
        scheduledAt: body.scheduledAt,
        nextRunAt: body.scheduledAt,
        recurrence: body.recurrence,
        segment: body.segment,
        category: body.category,
        targetAccountKey: body.segment === "ACCOUNT" ? body.targetAccountKey : null,
        maxPerDay: body.maxPerDay
      }
    });
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo lịch gửi." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const body = z.object({ id: z.string().min(1), action: z.enum(["send-now", "cancel", "test-admin"]) }).parse(await request.json());
    const campaign = await prisma.pushCampaign.findUniqueOrThrow({ where: { id: body.id } });
    if (body.action === "cancel") {
      return NextResponse.json({ campaign: await prisma.pushCampaign.update({ where: { id: body.id }, data: { status: "CANCELLED", nextRunAt: null } }) });
    }
    const result = await sendPush({
      title: campaign.title,
      message: campaign.message,
      actionUrl: campaign.actionUrl,
      campaignId: campaign.id,
      segment: body.action === "test-admin" ? "ADMIN" : campaign.segment,
      category: campaign.category,
      targetAccountKey: campaign.targetAccountKey,
      maxPerDay: campaign.maxPerDay,
      bypassLimits: body.action === "test-admin"
    });
    await prisma.pushCampaign.update({
      where: { id: body.id },
      data: { lastSentAt: new Date(), sentCount: { increment: result.sent }, failedCount: { increment: result.failed } }
    });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể gửi thông báo." }, { status: 400 });
  }
}
