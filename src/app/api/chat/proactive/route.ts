import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";

export async function GET(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  let accountKey: string | undefined;
  try {
    accountKey = (JSON.parse(session?.state ?? "{}") as { account?: { accountKey?: string } }).account?.accountKey;
  } catch {}
  const now = new Date();
  const notifications = await prisma.proactiveNotification.findMany({
    where: {
      deliverAt: { lte: now },
      readAt: null,
      OR: [{ sessionId }, ...(accountKey ? [{ accountKey }] : [])]
    },
    orderBy: { deliverAt: "desc" },
    take: 20
  });
  await prisma.proactiveNotification.updateMany({
    where: { id: { in: notifications.map((item) => item.id) }, deliveredAt: null },
    data: { deliveredAt: now }
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Thiếu ID." }, { status: 400 });
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  let accountKey: string | undefined;
  try {
    accountKey = (JSON.parse(session?.state ?? "{}") as { account?: { accountKey?: string } }).account?.accountKey;
  } catch {}
  const notification = await prisma.proactiveNotification.findFirst({ where: { id: body.id, OR: [{ sessionId }, ...(accountKey ? [{ accountKey }] : [])] } });
  if (!notification) return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  await prisma.proactiveNotification.update({ where: { id: body.id }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}
