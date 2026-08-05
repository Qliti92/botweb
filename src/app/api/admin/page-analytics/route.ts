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

const vietnamOffsetMs = 7 * 60 * 60 * 1000;

function periodStart(period: string | null, now = new Date()) {
  if (!period || period === "all") return undefined;
  const vietnamNow = new Date(now.getTime() + vietnamOffsetMs);
  const year = vietnamNow.getUTCFullYear();
  const month = vietnamNow.getUTCMonth();
  const day = vietnamNow.getUTCDate();
  const today = new Date(Date.UTC(year, month, day) - vietnamOffsetMs);

  if (period === "day") return today;
  if (period === "week") {
    const weekday = vietnamNow.getUTCDay() || 7;
    return new Date(today.getTime() - (weekday - 1) * 24 * 60 * 60 * 1000);
  }
  if (period === "month") return new Date(Date.UTC(year, month, 1) - vietnamOffsetMs);
  return undefined;
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
        action: { in: ["WEB_REGISTRATION_LINK_ENTERED", "WEB_REGISTRATION_STARTED", "WEB_REGISTRATION_STEP_2", "WEB_REGISTRATION_COMPLETED", "WEB_REGISTRATION_ABANDONED", "WEB_REGISTRATION_FAILED"] },
        createdAt: dateFilter
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
      select: { actorId: true, action: true, targetId: true, metadata: true, createdAt: true }
    })
  ]);

  const completedVisitors = new Set(registrations.map((item) => item.actorId).filter(Boolean));
  const funnelActors = (action: string) => new Set(funnelEvents.filter((item) => item.action === action).map((item) => item.actorId).filter(Boolean));
  const startedVisitors = funnelActors("WEB_REGISTRATION_STARTED");
  const linkEnteredVisitors = funnelActors("WEB_REGISTRATION_LINK_ENTERED");
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
    abandonmentDetail?: string;
  };
  const attempts = new Map<string, RegistrationAttempt>();
  const completedSessionIds = funnelEvents
    .filter((item) => item.action === "WEB_REGISTRATION_COMPLETED" && item.targetId)
    .map((item) => item.targetId as string);
  const completedSessions = completedSessionIds.length
    ? await prisma.chatSession.findMany({
        where: { id: { in: completedSessionIds } },
        select: { id: true, state: true }
      })
    : [];
  const completedEmails = new Map(completedSessions.map((session) => {
    try {
      const state = JSON.parse(session.state || "{}") as { account?: { email?: string } };
      return [session.id, state.account?.email?.trim().toLowerCase()] as const;
    } catch {
      return [session.id, undefined] as const;
    }
  }));
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
    if (metadata.inputSnapshot && typeof metadata.inputSnapshot === "object") {
      const input = metadata.inputSnapshot as Record<string, unknown>;
      attempt.inputSnapshot = {
        ...attempt.inputSnapshot,
        email: input.email ? String(input.email) : attempt.inputSnapshot?.email,
        name: input.name ? String(input.name) : attempt.inputSnapshot?.name,
        phone: input.phone ? String(input.phone) : attempt.inputSnapshot?.phone,
        referralCode: input.referralCode ? String(input.referralCode) : attempt.inputSnapshot?.referralCode
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
    if (stage === "COMPLETED") {
      const completedEmail = item.targetId ? completedEmails.get(item.targetId) : undefined;
      if (completedEmail) attempt.inputSnapshot = { ...attempt.inputSnapshot, email: completedEmail };
    }
    attempts.set(key, attempt);
  }
  const recentRegistrationAttempts = Array.from(attempts.values())
    .map((attempt) => {
      const hasInput = Boolean(attempt.inputSnapshot?.email || attempt.inputSnapshot?.name || attempt.inputSnapshot?.phone || attempt.inputSnapshot?.referralCode);
      return {
        ...attempt,
        stages: Array.from(attempt.stages),
        abandonmentDetail: attempt.stages.has("ABANDONED")
          ? attempt.inputSnapshot?.email
            ? `Bỏ dở sau khi nhập email ${attempt.inputSnapshot.email}`
            : hasInput
              ? "Bỏ dở khi đang nhập thông tin đăng ký"
              : attempt.stages.has("STARTED")
                ? "Đã mở form nhưng chưa nhập thông tin"
                : attempt.stages.has("LINK_ENTERED")
                  ? "Đã nhập link nhưng chưa mở form đăng ký"
                  : "Chưa nhập thông tin"
          : undefined,
        status: attempt.stages.has("COMPLETED")
        ? "COMPLETED"
        : attempt.stages.has("FAILED")
          ? "FAILED"
          : attempt.latestStage === "ABANDONED"
            ? "ABANDONED"
            : "IN_PROGRESS"
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);
  const allAttempts = Array.from(attempts.values());
  const linkEnteredAttempts = allAttempts.filter((attempt) => attempt.stages.has("LINK_ENTERED")).length;
  const startedAttempts = allAttempts.filter((attempt) => attempt.stages.has("STARTED")).length;
  const completedAttempts = allAttempts.filter((attempt) => attempt.stages.has("COMPLETED")).length;
  const failedAttempts = allAttempts.filter((attempt) => attempt.stages.has("FAILED") && !attempt.stages.has("COMPLETED")).length;
  const abandonedAttempts = allAttempts.filter((attempt) => attempt.stages.has("ABANDONED") && !attempt.stages.has("COMPLETED") && !attempt.stages.has("FAILED")).length;
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
      linkEntered: linkEnteredAttempts || linkEnteredVisitors.size,
      started: startedAttempts,
      reachedStepTwo: stepTwoVisitors.size,
      completed: completedAttempts,
      abandoned: abandonedAttempts,
      failed: failedAttempts,
      failedAttempts: failedEvents.length,
      completionRate: startedAttempts ? Math.round(completedAttempts / startedAttempts * 100) : 0,
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
          "WEB_REGISTRATION_LINK_ENTERED",
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
