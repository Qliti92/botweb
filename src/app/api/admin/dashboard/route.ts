import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalSessions, activeSessions24h, newSessions24h, previousSessions24h,
    messages24h, previousMessages24h, messages7d,
    registrations24h, registrations7d, registrationFailures24h,
    links24h, links7d, shopClicks24h, shopClicks7d, visits24h,
    openTickets, urgentTickets, resolvedTickets7d,
    unresolved, failedJobs, pendingJobs,
    apiCalls24h, apiFailures24h, previousApiFailures24h,
    pushSubscribers, activeCampaigns, pushSent24h, pushFailed24h,
    lastChat, lastRegistration, lastLink, lastApiCall, lastCron
  ] = await Promise.all([
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { updatedAt: { gte: since24h } } }),
    prisma.chatSession.count({ where: { createdAt: { gte: since24h } } }),
    prisma.chatSession.count({ where: { createdAt: { gte: previous24h, lt: since24h } } }),
    prisma.chatMessage.count({ where: { createdAt: { gte: since24h } } }),
    prisma.chatMessage.count({ where: { createdAt: { gte: previous24h, lt: since24h } } }),
    prisma.chatMessage.count({ where: { createdAt: { gte: since7d } } }),
    prisma.auditLog.count({ where: { action: "WEB_REGISTRATION_COMPLETED", createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "WEB_REGISTRATION_COMPLETED", createdAt: { gte: since7d } } }),
    prisma.auditLog.count({ where: { action: "WEB_REGISTRATION_FAILED", createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "CASHBACK_LINK_CREATED", createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "CASHBACK_LINK_CREATED", createdAt: { gte: since7d } } }),
    prisma.auditLog.count({ where: { action: "CASHBACK_SHOP_CLICKED", createdAt: { gte: since24h } } }),
    prisma.auditLog.count({ where: { action: "CASHBACK_SHOP_CLICKED", createdAt: { gte: since7d } } }),
    prisma.auditLog.count({ where: { action: "PAGE_VISIT", createdAt: { gte: since24h } } }),
    prisma.supportTicket.count({ where: { status: { in: ["NEW", "IN_PROGRESS", "WAITING_USER"] } } }),
    prisma.supportTicket.count({ where: { priority: { in: ["HIGH", "URGENT"] }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] }, updatedAt: { gte: since7d } } }),
    prisma.unrecognizedMessage.count({ where: { isResolved: false } }),
    prisma.jobQueue.count({ where: { status: "FAILED" } }),
    prisma.jobQueue.count({ where: { status: "PENDING" } }),
    prisma.apiLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: since24h }, OR: [{ error: { not: null } }, { statusCode: { gte: 400 } }] } }),
    prisma.apiLog.count({ where: { createdAt: { gte: previous24h, lt: since24h }, OR: [{ error: { not: null } }, { statusCode: { gte: 400 } }] } }),
    prisma.webPushSubscription.count({ where: { enabled: true, isAdmin: false } }),
    prisma.pushCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.pushDelivery.count({ where: { status: "SENT", createdAt: { gte: since24h } } }),
    prisma.pushDelivery.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
    prisma.chatMessage.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where: { action: "WEB_REGISTRATION_COMPLETED" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where: { action: "CASHBACK_LINK_CREATED" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.apiLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.pushCronRun.findFirst({ orderBy: { startedAt: "desc" }, select: { status: true, startedAt: true, endedAt: true, processed: true, error: true } })
  ]);

  const apiFailureRate = apiCalls24h ? Math.round(apiFailures24h / apiCalls24h * 100) : 0;
  const healthLevel = failedJobs > 0 || apiFailureRate >= 20
    ? "critical"
    : urgentTickets > 0 || apiFailureRate >= 5 || pushFailed24h > 0
      ? "warning"
      : "healthy";

  return NextResponse.json({
    generatedAt: now.toISOString(),
    health: { level: healthLevel, apiFailureRate },
    metrics: {
      usage: { totalSessions, activeSessions24h, newSessions24h, previousSessions24h, messages24h, previousMessages24h, messages7d, visits24h },
      business: {
        registrations24h,
        registrations7d,
        registrationFailures24h,
        links24h,
        links7d,
        shopClicks24h,
        shopClicks7d,
        clickThroughRate24h: links24h ? Math.round(shopClicks24h / links24h * 100) : 0,
        clickThroughRate7d: links7d ? Math.round(shopClicks7d / links7d * 100) : 0
      },
      support: { openTickets, urgentTickets, resolvedTickets7d, unresolved },
      system: { apiCalls24h, apiFailures24h, previousApiFailures24h, apiFailureRate, failedJobs, pendingJobs },
      push: { subscribers: pushSubscribers, activeCampaigns, sent24h: pushSent24h, failed24h: pushFailed24h }
    },
    latest: {
      chat: lastChat?.createdAt ?? null,
      registration: lastRegistration?.createdAt ?? null,
      link: lastLink?.createdAt ?? null,
      api: lastApiCall?.createdAt ?? null,
      cron: lastCron
    }
  });
}
