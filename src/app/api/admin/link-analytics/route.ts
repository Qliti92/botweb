import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const vietnamOffsetMs = 7 * 60 * 60 * 1000;

function vietnamBoundaries(now = new Date()) {
  const shifted = new Date(now.getTime() + vietnamOffsetMs);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const today = new Date(Date.UTC(year, month, day) - vietnamOffsetMs);
  const weekday = shifted.getUTCDay() || 7;
  const week = new Date(today.getTime() - (weekday - 1) * 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(year, month, 1) - vietnamOffsetMs);
  return { today, week, month: monthStart };
}

async function countSince(action: string, since?: Date) {
  return prisma.auditLog.count({ where: { action, ...(since ? { createdAt: { gte: since } } : {}) } });
}

export async function GET() {
  await requireAdmin();
  const boundaries = vietnamBoundaries();
  const [totalCreated, totalClicked, todayCreated, todayClicked, weekCreated, weekClicked, monthCreated, monthClicked, createdLogs] = await Promise.all([
    countSince("CASHBACK_LINK_CREATED"),
    countSince("CASHBACK_SHOP_CLICKED"),
    countSince("CASHBACK_LINK_CREATED", boundaries.today),
    countSince("CASHBACK_SHOP_CLICKED", boundaries.today),
    countSince("CASHBACK_LINK_CREATED", boundaries.week),
    countSince("CASHBACK_SHOP_CLICKED", boundaries.week),
    countSince("CASHBACK_LINK_CREATED", boundaries.month),
    countSince("CASHBACK_SHOP_CLICKED", boundaries.month),
    prisma.auditLog.findMany({
      where: { action: "CASHBACK_LINK_CREATED" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, action: true, actorId: true, targetId: true, metadata: true, createdAt: true }
    })
  ]);

  const clicks = createdLogs.length ? await prisma.auditLog.findMany({
    where: { action: "CASHBACK_SHOP_CLICKED", targetId: { in: createdLogs.map((log) => log.id) } },
    orderBy: { createdAt: "desc" },
    select: { targetId: true, createdAt: true }
  }) : [];
  const clicksByLink = new Map<string, { count: number; lastClickedAt: Date }>();
  for (const click of clicks) {
    if (!click.targetId) continue;
    const current = clicksByLink.get(click.targetId);
    clicksByLink.set(click.targetId, {
      count: (current?.count ?? 0) + 1,
      lastClickedAt: current?.lastClickedAt ?? click.createdAt
    });
  }

  const events = createdLogs.map((log) => {
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(log.metadata || "{}") as Record<string, unknown>; } catch {}
    const clickStats = clicksByLink.get(log.id);
    return {
      id: log.id,
      accountKey: log.actorId,
      userName: String(metadata.name || ""),
      email: String(metadata.email || ""),
      phone: String(metadata.phone || ""),
      platform: String(metadata.platform || "shop"),
      sourceUrl: String(metadata.sourceUrl || ""),
      affiliateUrl: String(metadata.affiliateUrl || ""),
      productName: String(metadata.productName || ""),
      productImage: String(metadata.productImage || ""),
      cashbackAmount: metadata.cashbackAmount ?? null,
      createdAt: log.createdAt,
      clickCount: clickStats?.count ?? 0,
      lastClickedAt: clickStats?.lastClickedAt ?? null
    };
  });

  return NextResponse.json({
    periods: {
      total: { created: totalCreated, clicked: totalClicked },
      today: { created: todayCreated, clicked: todayClicked },
      week: { created: weekCreated, clicked: weekClicked },
      month: { created: monthCreated, clicked: monthClicked }
    },
    events
  });
}
