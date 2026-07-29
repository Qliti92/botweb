import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageStat = {
  path: string;
  visits: number;
  visitors: Set<string>;
  durationTotal: number;
  durationSamples: number;
  interactions: number;
  registrations: number;
  sources: Map<string, number>;
};

const periodDays = { day: 1, week: 7, month: 30 } as const;

function periodStart(period: string | null) {
  if (!period || period === "all") return undefined;
  const days = periodDays[period as keyof typeof periodDays];
  if (!days) return undefined;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const period = request.nextUrl.searchParams.get("period") || "month";
  const createdAt = periodStart(period);
  const dateFilter = createdAt ? { gte: createdAt } : undefined;
  const [visits, registrations, funnelEvents] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: "PAGE_VISIT", createdAt: dateFilter },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: { actorId: true, targetId: true, metadata: true, createdAt: true }
    }),
    prisma.auditLog.findMany({
      where: { action: "WEB_REGISTRATION_COMPLETED", createdAt: dateFilter },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: { actorId: true, metadata: true }
    }),
    prisma.auditLog.findMany({
      where: {
        action: { in: ["WEB_REGISTRATION_STARTED", "WEB_REGISTRATION_STEP_2", "WEB_REGISTRATION_COMPLETED", "WEB_REGISTRATION_ABANDONED", "WEB_REGISTRATION_FAILED"] },
        createdAt: dateFilter
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
      select: { actorId: true, action: true, metadata: true, createdAt: true }
    })
  ]);

  const completedVisitors = new Set(registrations.map((item) => item.actorId).filter(Boolean));
  const funnelActors = (action: string) => new Set(funnelEvents.filter((item) => item.action === action).map((item) => item.actorId).filter(Boolean));
  const startedVisitors = funnelActors("WEB_REGISTRATION_STARTED");
  const stepTwoVisitors = funnelActors("WEB_REGISTRATION_STEP_2");
  const abandonedVisitors = funnelActors("WEB_REGISTRATION_ABANDONED");
  const failedVisitors = funnelActors("WEB_REGISTRATION_FAILED");
  const abandonedWithoutCompletion = Array.from(abandonedVisitors).filter((actorId) => !completedVisitors.has(actorId)).length;
  const parseMetadata = (value: string) => {
    try { return JSON.parse(value || "{}") as Record<string, unknown>; } catch { return {} as Record<string, unknown>; }
  };
  const countBy = (items: typeof funnelEvents, field: string) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = String(parseMetadata(item.metadata)[field] || "Không xác định");
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };
  const startedEvents = funnelEvents.filter((item) => item.action === "WEB_REGISTRATION_STARTED");
  const abandonedEvents = funnelEvents.filter((item) => item.action === "WEB_REGISTRATION_ABANDONED" && !completedVisitors.has(item.actorId));
  const failedEvents = funnelEvents.filter((item) => item.action === "WEB_REGISTRATION_FAILED");
  type RegistrationAttempt = {
    key: string;
    visitor: string;
    startedAt: string;
    updatedAt: string;
    source: string;
    device: string;
    path: string;
    context: string;
    stages: Set<string>;
    latestStage: string;
    lastStep?: number;
    failureCount: number;
    errorCategory?: string;
    errorCode?: string;
    errorMessage?: string;
    apiResponse?: string;
    httpStatus?: number;
    inputSnapshot?: { email?: string; name?: string; phone?: string; referralCode?: string };
  };
  const attempts = new Map<string, RegistrationAttempt>();
  for (const item of funnelEvents) {
    const metadata = parseMetadata(item.metadata);
    const stage = item.action.replace("WEB_REGISTRATION_", "");
    const attemptId = metadata.attemptId ? String(metadata.attemptId) : "";
    const key = attemptId || `legacy:${item.actorId || "unknown"}`;
    const createdAt = item.createdAt.toISOString();
    const step = Number(metadata.step || 0) || undefined;
    const existing = attempts.get(key);
    const attempt = existing ?? {
      key,
      visitor: item.actorId ? `…${item.actorId.slice(-8)}` : "Không xác định",
      startedAt: createdAt,
      updatedAt: createdAt,
      source: String(metadata.source || "Trực tiếp"),
      device: String(metadata.device || "Không xác định"),
      path: String(metadata.path || "/"),
      context: String(metadata.context || "MAIN_REGISTER"),
      stages: new Set<string>(),
      latestStage: stage,
      lastStep: step,
      failureCount: 0
    };
    if (createdAt < attempt.startedAt) attempt.startedAt = createdAt;
    if (createdAt > attempt.updatedAt) {
      attempt.updatedAt = createdAt;
      attempt.latestStage = stage;
    }
    attempt.stages.add(stage);
    attempt.lastStep = Math.max(attempt.lastStep ?? 0, step ?? 0) || undefined;
    if (!attempt.inputSnapshot && metadata.inputSnapshot && typeof metadata.inputSnapshot === "object") {
      const input = metadata.inputSnapshot as Record<string, unknown>;
      attempt.inputSnapshot = {
        email: input.email ? String(input.email) : undefined,
        name: input.name ? String(input.name) : undefined,
        phone: input.phone ? String(input.phone) : undefined,
        referralCode: input.referralCode ? String(input.referralCode) : undefined
      };
    }
    if (stage === "FAILED") {
      attempt.failureCount += 1;
      if (!attempt.errorMessage) {
        attempt.errorCategory = metadata.errorCategory ? String(metadata.errorCategory) : undefined;
        attempt.errorCode = metadata.errorCode ? String(metadata.errorCode) : undefined;
        attempt.errorMessage = metadata.errorMessage ? String(metadata.errorMessage) : undefined;
        attempt.apiResponse = metadata.apiResponse ? String(metadata.apiResponse) : undefined;
        attempt.httpStatus = Number(metadata.httpStatus || 0) || undefined;
      }
    }
    if (!attempt.apiResponse && metadata.apiResponse) attempt.apiResponse = String(metadata.apiResponse);
    attempts.set(key, attempt);
  }
  const recentRegistrationAttempts = Array.from(attempts.values())
    .map((attempt) => ({
      ...attempt,
      stages: Array.from(attempt.stages),
      status: attempt.stages.has("COMPLETED")
        ? "COMPLETED"
        : attempt.stages.has("FAILED")
          ? "FAILED"
          : attempt.latestStage === "ABANDONED"
            ? "ABANDONED"
            : "IN_PROGRESS"
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);
  const sources = countBy(startedEvents, "source").map((source) => {
    const actors = new Set(startedEvents.filter((item) => String(parseMetadata(item.metadata).source || "Không xác định") === source.name).map((item) => item.actorId));
    const completed = Array.from(actors).filter((actorId) => completedVisitors.has(actorId)).length;
    return { ...source, completed, completionRate: actors.size ? Math.round(completed / actors.size * 100) : 0 };
  });

  const registrationsByPath = new Map<string, number>();
  for (const registration of registrations) {
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(registration.metadata || "{}") as Record<string, unknown>; } catch {}
    const path = String(metadata.path || "/");
    registrationsByPath.set(path, (registrationsByPath.get(path) ?? 0) + 1);
  }
  const pages = new Map<string, PageStat>();
  for (const visit of visits) {
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(visit.metadata || "{}") as Record<string, unknown>; } catch {}
    const path = String(metadata.path || visit.targetId || "/");
    const source = String(metadata.source || "Trực tiếp");
    const duration = Math.max(0, Number(metadata.durationSeconds || 0));
    const current = pages.get(path) ?? {
      path,
      visits: 0,
      visitors: new Set<string>(),
      durationTotal: 0,
      durationSamples: 0,
      interactions: 0,
      registrations: 0,
      sources: new Map<string, number>()
    };
    current.visits += 1;
    if (visit.actorId) current.visitors.add(visit.actorId);
    if (duration > 0) {
      current.durationTotal += duration;
      current.durationSamples += 1;
    }
    if (metadata.interacted === true) current.interactions += 1;
    current.sources.set(source, (current.sources.get(source) ?? 0) + 1);
    pages.set(path, current);
  }

  for (const [path, count] of registrationsByPath) {
    const page = pages.get(path);
    if (page) page.registrations = count;
  }

  return NextResponse.json({
    period,
    registrationFunnel: {
      started: startedVisitors.size,
      reachedStepTwo: stepTwoVisitors.size,
      completed: completedVisitors.size,
      abandoned: abandonedWithoutCompletion,
      failed: failedVisitors.size,
      failedAttempts: failedEvents.length,
      completionRate: startedVisitors.size ? Math.round(completedVisitors.size / startedVisitors.size * 100) : 0,
      abandonedByStep: countBy(abandonedEvents, "step"),
      failureReasons: countBy(failedEvents, "errorCategory"),
      sources,
      devices: countBy(startedEvents, "device"),
      recentAttempts: recentRegistrationAttempts
    },
    pages: Array.from(pages.values())
      .map((page) => ({
        path: page.path,
        visits: page.visits,
        uniqueVisitors: page.visitors.size,
        averageDurationSeconds: page.durationSamples ? Math.round(page.durationTotal / page.durationSamples) : 0,
        interactionRate: page.visits ? Math.round(page.interactions / page.visits * 100) : 0,
        registrations: page.registrations,
        registrationRate: page.visits ? Math.round(page.registrations / page.visits * 100) : 0,
        sources: Array.from(page.sources.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      }))
      .sort((a, b) => b.visits - a.visits)
  });
}

export async function DELETE() {
  await requireAdmin();
  const result = await prisma.auditLog.deleteMany({
    where: {
      action: {
        in: [
          "PAGE_VISIT",
          "WEB_REGISTRATION_STARTED",
          "WEB_REGISTRATION_STEP_2",
          "WEB_REGISTRATION_COMPLETED",
          "WEB_REGISTRATION_ABANDONED",
          "WEB_REGISTRATION_FAILED"
        ]
      }
    }
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}
