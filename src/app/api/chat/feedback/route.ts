import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { writeAuditLog } from "@/lib/audit";

const feedbackSchema = z.object({
  messageId: z.string().min(1),
  rating: z.enum(["helpful", "not_helpful"])
});

export async function POST(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const body = feedbackSchema.parse(await request.json());
  const message = await prisma.chatMessage.findFirst({
    where: { id: body.messageId, sessionId, sender: "BOT" },
    select: { id: true, content: true }
  });
  if (!message) return NextResponse.json({ error: "Không tìm thấy câu trả lời để đánh giá." }, { status: 404 });

  const existing = await prisma.auditLog.findFirst({
    where: { actorId: sessionId, action: "CHAT_FEEDBACK", targetId: message.id }
  });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await writeAuditLog({
    actorType: "USER",
    actorId: sessionId,
    action: "CHAT_FEEDBACK",
    targetType: "ChatMessage",
    targetId: message.id,
    metadata: { rating: body.rating, preview: message.content.slice(0, 240) }
  });
  return NextResponse.json({ ok: true });
}
