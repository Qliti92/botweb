import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    where: { action: "CHAT_FEEDBACK" },
    orderBy: { createdAt: "desc" },
    take: 300
  });
  const feedback = logs.map((item) => {
    let metadata: { rating?: string; preview?: string } = {};
    try { metadata = JSON.parse(item.metadata); } catch {}
    return {
      id: item.id,
      messageId: item.targetId,
      rating: metadata.rating ?? "unknown",
      preview: metadata.preview ?? "",
      createdAt: item.createdAt
    };
  });
  return NextResponse.json({ feedback });
}
