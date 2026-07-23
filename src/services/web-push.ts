import webPush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey =
  process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_KEY ||
  "BM_6jbbW8ANIcPRXq_khHdmFYxr26lvh6CrDcceZ0yS13npv4Bs8d1KhG_WqO-c1hpPLuBsGqB3ppRTyUIMvMBc";

const defaultCampaigns = [
  ["Nhớ tạo link trước khi mua nhé", "Bạn sắp mua hàng? Gửi link Shopee hoặc TikTok Shop cho Ry trước khi thanh toán để không bỏ lỡ cơ hội hoàn tiền."],
  ["Giờ nghỉ trưa, săn deal thông minh", "Trước khi chốt đơn, mở Em Ry và tạo link hoàn tiền chỉ trong vài giây nhé."],
  ["Mua sắm chiều nay cùng Ry", "Đã chọn được món ưng ý? Hãy tạo link hoàn tiền trước khi thêm lại sản phẩm vào giỏ."],
  ["Khung giờ mua sắm buổi tối", "Đừng thanh toán vội — gửi link sản phẩm cho Ry để kiểm tra và tạo link hoàn tiền trước nhé."],
  ["Một bước nhỏ để không bỏ lỡ tiền hoàn", "Luôn bắt đầu đơn hàng từ link do Em Ry tạo và hoàn tất trên cùng thiết bị."],
  ["Kiểm tra đơn hàng của bạn", "Mở Em Ry để xem đơn gần đây, trạng thái đối soát và tiền hoàn dự kiến."],
  ["Săn deal nhưng đừng quên hoàn tiền", "Dù Shopee hay TikTok Shop, hãy tạo link cùng Ry trước khi đặt hàng."],
  ["Tối nay bạn định mua gì?", "Gửi link món đồ bạn thích, Ry sẽ giúp tạo link hoàn tiền thật nhanh."],
  ["Giỏ hàng đã sẵn sàng chưa?", "Để đơn dễ ghi nhận, hãy để giỏ trống rồi mở link hoàn tiền của Ry trước khi mua."],
  ["Nhắc nhẹ trước giờ săn sale", "Mở Em Ry trước khi chốt đơn để vừa săn giá tốt vừa có cơ hội nhận tiền hoàn."]
] as const;

function configure() {
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  if (!privateKey) throw new Error("Thiếu WEB_PUSH_VAPID_PRIVATE_KEY.");
  webPush.setVapidDetails(process.env.WEB_PUSH_SUBJECT || "mailto:admin@tranquan.vn", publicKey, privateKey);
}

function localTime(timezone: string, date: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
    const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
    return `${hour}:${minute}`;
  } catch {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  }
}

function inQuietHours(current: string, start: string, end: string) {
  if (start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function categoriesOf(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 1000);
  return String(error).slice(0, 1000);
}

export type PushPayload = {
  title: string;
  message: string;
  actionUrl?: string | null;
  campaignId?: string;
  segment?: string;
  category?: string;
  targetAccountKey?: string | null;
  maxPerDay?: number;
  bypassLimits?: boolean;
};

export async function sendPush(payload: PushPayload) {
  configure();
  const now = new Date();
  const where =
    payload.segment === "ADMIN"
      ? { enabled: true, isAdmin: true }
      : payload.segment === "INACTIVE_3D"
        ? { enabled: true, isAdmin: false, lastSeenAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) } }
        : payload.segment === "ACCOUNT" && payload.targetAccountKey
          ? { enabled: true, accountKey: payload.targetAccountKey }
          : { enabled: true, isAdmin: false };
  const subscriptions = await prisma.webPushSubscription.findMany({ where });
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  await Promise.allSettled(
    subscriptions.map(async (item) => {
      const category = payload.category || "REMINDER";
      if (!payload.bypassLimits) {
        if (!categoriesOf(item.categories).includes(category)) {
          skipped += 1;
          return;
        }
        if (inQuietHours(localTime(item.timezone, now), item.quietStart, item.quietEnd)) {
          skipped += 1;
          return;
        }
        const recentCount = await prisma.pushDelivery.count({
          where: { subscriptionId: item.id, status: "SENT", sentAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
        });
        if (recentCount >= (payload.maxPerDay ?? 2)) {
          skipped += 1;
          return;
        }
      }

      const delivery = await prisma.pushDelivery.create({
        data: {
          campaignId: payload.campaignId,
          subscriptionId: item.id,
          status: "PENDING",
          actionUrl: payload.actionUrl || "/"
        }
      });
      try {
        await webPush.sendNotification(
          { endpoint: item.endpoint, keys: { p256dh: item.p256dh, auth: item.auth } },
          JSON.stringify({
            title: payload.title,
            body: payload.message,
            url: `/api/push/click/${delivery.id}`,
            icon: "/api/site-assets/logo"
          }),
          { TTL: 60 * 60 }
        );
        sent += 1;
        await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: now } });
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", error: errorMessage(error) } });
        if (statusCode === 404 || statusCode === 410) {
          await prisma.webPushSubscription.delete({ where: { id: item.id } }).catch(() => null);
        }
      }
    })
  );

  return { total: subscriptions.length, sent, failed, skipped };
}

export async function processDuePushCampaigns(now = new Date()) {
  const cronRun = await prisma.pushCronRun.create({ data: { status: "RUNNING" } });
  try {
    const campaigns = await prisma.pushCampaign.findMany({
      where: { status: "ACTIVE", nextRunAt: { lte: now } },
      orderBy: { nextRunAt: "asc" },
      take: 25
    });
    const results = [];
    for (const campaign of campaigns) {
      const delivery = await sendPush({
        title: campaign.title,
        message: campaign.message,
        actionUrl: campaign.actionUrl,
        campaignId: campaign.id,
        segment: campaign.segment,
        category: campaign.category,
        targetAccountKey: campaign.targetAccountKey,
        maxPerDay: campaign.maxPerDay
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
    await prisma.pushCronRun.update({ where: { id: cronRun.id }, data: { status: "SUCCESS", processed: results.length, endedAt: new Date() } });
    return results;
  } catch (error) {
    await prisma.pushCronRun.update({ where: { id: cronRun.id }, data: { status: "FAILED", error: errorMessage(error), endedAt: new Date() } });
    throw error;
  }
}

function vietnamDateAt(dayOffset: number, hour: number, minute: number) {
  const local = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + dayOffset + 1, hour - 7, minute));
}

export async function ensureDefaultPushCampaigns() {
  const existing = new Map((await prisma.pushCampaign.findMany({ select: { id: true, title: true } })).map((item) => [item.title, item]));
  const times = [[9, 5], [11, 35], [15, 5], [20, 5], [9, 5], [11, 35], [15, 5], [20, 5], [11, 35], [20, 5]] as const;
  for (let index = 0; index < defaultCampaigns.length; index += 1) {
    const [title, message] = defaultCampaigns[index];
    const [hour, minute] = times[index];
    const scheduledAt = vietnamDateAt(Math.floor(index / 2), hour, minute);
    const saved = existing.get(title);
    if (saved) continue;
    await prisma.pushCampaign.create({
      data: {
        title,
        message,
        actionUrl: "https://tranquan.vn/",
        scheduledAt,
        nextRunAt: scheduledAt,
        recurrence: "ONCE",
        segment: "ALL",
        category: "REMINDER",
        maxPerDay: 2
      }
    });
  }
}
