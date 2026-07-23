import webPush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey =
  process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_KEY ||
  "BM_6jbbW8ANIcPRXq_khHdmFYxr26lvh6CrDcceZ0yS13npv4Bs8d1KhG_WqO-c1hpPLuBsGqB3ppRTyUIMvMBc";

function configure() {
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  if (!privateKey) throw new Error("Thiếu WEB_PUSH_VAPID_PRIVATE_KEY.");
  webPush.setVapidDetails(process.env.WEB_PUSH_SUBJECT || "mailto:admin@tranquan.vn", publicKey, privateKey);
}

export type PushPayload = { title: string; message: string; actionUrl?: string | null };

export async function sendPushToAll(payload: PushPayload) {
  configure();
  const subscriptions = await prisma.webPushSubscription.findMany();
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (item) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: { p256dh: item.p256dh, auth: item.auth }
          },
          JSON.stringify({
            title: payload.title,
            body: payload.message,
            url: payload.actionUrl || "/",
            icon: "/api/site-assets/logo"
          }),
          { TTL: 60 * 60 }
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.webPushSubscription.delete({ where: { id: item.id } }).catch(() => null);
        }
      }
    })
  );

  return { total: subscriptions.length, sent, failed };
}

export async function processDuePushCampaigns(now = new Date()) {
  const campaigns = await prisma.pushCampaign.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: now } },
    orderBy: { nextRunAt: "asc" },
    take: 25
  });

  const results = [];
  for (const campaign of campaigns) {
    const delivery = await sendPushToAll({
      title: campaign.title,
      message: campaign.message,
      actionUrl: campaign.actionUrl
    });
    const recurring = campaign.recurrence === "DAILY";
    const updated = await prisma.pushCampaign.update({
      where: { id: campaign.id },
      data: {
        lastSentAt: now,
        nextRunAt: recurring ? new Date((campaign.nextRunAt ?? now).getTime() + 24 * 60 * 60 * 1000) : null,
        status: recurring ? "ACTIVE" : "COMPLETED",
        sentCount: { increment: delivery.sent },
        failedCount: { increment: delivery.failed }
      }
    });
    results.push({ campaignId: updated.id, ...delivery });
  }
  return results;
}
