import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { supportTicketSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

function accountKeyFromState(raw: string) {
  try {
    return (JSON.parse(raw) as { account?: { accountKey?: string } }).account?.accountKey;
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  const accountKey = accountKeyFromState(session?.state ?? "{}");
  const tickets = await prisma.supportTicket.findMany({
    where: accountKey ? { accountKey } : { sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: 50
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const parsed = supportTicketSchema.parse(await request.json());
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  const accountKey = accountKeyFromState(session?.state ?? "{}");
  const ticket = await prisma.supportTicket.create({
    data: {
      sessionId,
      accountKey,
      orderId: parsed.orderId || null,
      category: parsed.category,
      subject: parsed.subject,
      description: parsed.description,
      priority: parsed.category === "MISSING_ORDER" || parsed.category === "WRONG_CASHBACK" ? "HIGH" : "NORMAL",
      messages: { create: { sender: "USER", content: parsed.description } }
    },
    include: { messages: true }
  });
  await writeAuditLog({ actorType: accountKey ? "USER" : "SYSTEM", actorId: accountKey ?? sessionId, action: "SUPPORT_TICKET_CREATE", targetType: "SupportTicket", targetId: ticket.id });
  return NextResponse.json({ ticket });
}
