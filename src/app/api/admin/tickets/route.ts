import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["NEW", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().trim().max(120).optional().nullable(),
  reply: z.string().trim().min(1).max(4000).optional()
});

export async function GET() {
  await requireAdmin();
  const tickets = await prisma.supportTicket.findMany({
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 200
  });
  return NextResponse.json({ tickets });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  const body = updateSchema.parse(await request.json());
  const ticket = await prisma.supportTicket.update({
    where: { id: body.id },
    data: {
      status: body.status,
      priority: body.priority,
      assignedTo: body.assignedTo,
      ...(body.reply ? { messages: { create: { sender: `ADMIN:${admin.adminId}`, content: body.reply } } } : {})
    },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
  if (body.reply) {
    await prisma.proactiveNotification.create({
      data: {
        accountKey: ticket.accountKey,
        sessionId: ticket.sessionId,
        title: `Ticket ${ticket.id.slice(-6)} có phản hồi`,
        message: body.reply
      }
    });
  }
  return NextResponse.json({ ticket });
}
