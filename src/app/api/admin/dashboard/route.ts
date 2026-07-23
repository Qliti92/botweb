import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [activeSessions, messages24h, openTickets, urgentTickets, unresolved, failedJobs, apiFailures] = await Promise.all([
    prisma.chatSession.count({ where: { updatedAt: { gte: since } } }),
    prisma.chatMessage.count({ where: { createdAt: { gte: since } } }),
    prisma.supportTicket.count({ where: { status: { in: ["NEW", "IN_PROGRESS", "WAITING_USER"] } } }),
    prisma.supportTicket.count({ where: { priority: { in: ["HIGH", "URGENT"] }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.unrecognizedMessage.count({ where: { isResolved: false } }),
    prisma.jobQueue.count({ where: { status: "FAILED" } }),
    prisma.apiLog.count({ where: { createdAt: { gte: since }, OR: [{ error: { not: null } }, { statusCode: { gte: 400 } }] } })
  ]);
  return NextResponse.json({ metrics: { activeSessions, messages24h, openTickets, urgentTickets, unresolved, failedJobs, apiFailures } });
}
