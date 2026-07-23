import { prisma } from "@/lib/prisma";
import { normalizeVietnamese } from "@/services/intent";

function maskPersonalData(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/\+?\d[\d\s.-]{7,}\d/g, "[SỐ ĐÃ ẨN]")
    .slice(0, 500);
}

export async function recordUnrecognizedMessage(sessionId: string, content: string) {
  const safeContent = maskPersonalData(content.trim());
  if (!safeContent) return;
  const normalized = normalizeVietnamese(safeContent);
  const recentDuplicate = await prisma.unrecognizedMessage.findFirst({
    where: { sessionId, normalized, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } }
  });
  if (recentDuplicate) return;
  await prisma.unrecognizedMessage.create({ data: { sessionId, content: safeContent, normalized } });
}
