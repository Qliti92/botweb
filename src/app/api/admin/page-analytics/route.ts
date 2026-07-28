import { NextResponse } from "next/server";
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

export async function GET() {
  await requireAdmin();
  const [visits, registrations] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: "PAGE_VISIT" },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: { actorId: true, targetId: true, metadata: true, createdAt: true }
    }),
    prisma.auditLog.findMany({
      where: { action: "WEB_REGISTRATION_COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: { actorId: true, metadata: true }
    })
  ]);

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
