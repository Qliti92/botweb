import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { proactiveNotificationSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();
  const notifications = await prisma.proactiveNotification.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  assertSameOrigin(request);
  const body = proactiveNotificationSchema.parse(await request.json());
  if (!body.accountKey && !body.sessionId) throw new Error("Cần accountKey hoặc sessionId.");
  const notification = await prisma.proactiveNotification.create({
    data: { ...body, actionUrl: body.actionUrl || null, deliverAt: body.deliverAt ?? new Date() }
  });
  return NextResponse.json({ notification });
}
