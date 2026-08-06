import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const logs = await prisma.auditLog.findMany({
    where: {
      action: { in: ["CASHBACK_LINK_CREATED", "WITHDRAWAL_CREATE_FORM"] },
      outcome: "SUCCESS",
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, action: true, targetId: true, metadata: true, createdAt: true }
  });

  const sessionIds = logs.filter(log => log.action === "WITHDRAWAL_CREATE_FORM" && log.targetId).map(log => log.targetId as string);
  const sessions = sessionIds.length ? await prisma.chatSession.findMany({
    where: { id: { in: sessionIds } },
    select: { id: true, state: true }
  }) : [];
  const namesBySession = new Map(sessions.map(session => {
    let state: { account?: { name?: string; email?: string } } = {};
    try { state = JSON.parse(session.state || "{}") as typeof state; } catch {}
    return [session.id, state.account?.name || state.account?.email?.split("@")[0] || ""];
  }));

  function shortName(value: unknown) {
    const raw = String(value || "").trim();
    if (/[ÃÂÄº»¢§]|â€/.test(raw)) return undefined;
    const parts = raw.split(/\s+/).filter(Boolean);
    if (!parts.length) return undefined;
    if (parts.length === 1) return `${parts[0]}***`;
    return `${parts[0]} ${parts.at(-1)}**`;
  }

  const activities = logs.map((log) => {
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(log.metadata || "{}") as Record<string, unknown>; } catch {}
    if (log.action === "WITHDRAWAL_CREATE_FORM") {
      const amount = Number(metadata.amount);
      return {
        id: log.id,
        kind: "withdrawal" as const,
        name: shortName(namesBySession.get(log.targetId || "")),
        amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : undefined,
        createdAt: log.createdAt.toISOString()
      };
    }
    const platform = String(metadata.platform || "").toLowerCase();
    return {
      id: log.id,
      kind: "link" as const,
      name: shortName(metadata.name || String(metadata.email || "").split("@")[0]),
      platform: platform.includes("shopee") ? "Shopee" : platform.includes("tiktok") ? "TikTok Shop" : undefined,
      createdAt: log.createdAt.toISOString()
    };
  });

  return NextResponse.json({ activities }, { headers: { "Cache-Control": "no-store" } });
}
