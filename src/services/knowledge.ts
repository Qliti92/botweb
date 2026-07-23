import { prisma } from "@/lib/prisma";
import { normalizeVietnamese } from "@/services/intent";

function tokens(value: string) {
  return new Set(normalizeVietnamese(value).split(" ").filter((token) => token.length > 1));
}

export async function findKnowledgeAnswer(query: string) {
  const queryTokens = tokens(query);
  if (!queryTokens.size) return null;
  const entries = await prisma.knowledgeEntry.findMany({ where: { isActive: true }, orderBy: { updatedAt: "desc" }, take: 100 });

  let best: { entry: (typeof entries)[number]; score: number } | null = null;
  for (const entry of entries) {
    const searchable = tokens(`${entry.question} ${entry.keywords} ${entry.category}`);
    const matched = [...queryTokens].filter((token) => searchable.has(token)).length;
    const score = matched / Math.max(2, Math.min(queryTokens.size, 8));
    if (!best || score > best.score) best = { entry, score };
  }

  if (!best || best.score < 0.34) return null;
  const source = best.entry.sourceUrl ? `\n\nNguồn Ry tham khảo: ${best.entry.sourceUrl}` : `\n\nNguồn Ry tham khảo: ${best.entry.sourceLabel}`;
  return { content: `${best.entry.answer}${source}`, confidence: Math.min(0.95, best.score), entryId: best.entry.id };
}
