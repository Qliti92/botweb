import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ sessionId: z.string().min(1).max(100) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`cashback-click:${ip}`, 60, 60_000).ok) {
    return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });
  }
  try {
    const body = schema.parse(await request.json());
    await requireMatchingChatSession(request, body.sessionId);
    const { id } = await params;
    const created = await prisma.auditLog.findFirst({ where: { id, action: "CASHBACK_LINK_CREATED" } });
    if (!created) return NextResponse.json({ error: "Không tìm thấy link." }, { status: 404 });

    const metadata = JSON.parse(created.metadata || "{}") as Record<string, unknown>;
    if (metadata.sessionId !== body.sessionId) {
      return NextResponse.json({ error: "Phiên truy cập không hợp lệ." }, { status: 403 });
    }
    await writeAuditLog({
      actorType: "USER",
      actorId: created.actorId ?? undefined,
      action: "CASHBACK_SHOP_CLICKED",
      targetType: "CashbackLink",
      targetId: created.id,
      metadata
    });
    return NextResponse.json({ tracked: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể ghi nhận lượt bấm." }, { status: 400 });
  }
}
