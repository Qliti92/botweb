import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { knowledgeEntrySchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  await requireAdmin();
  const entries = await prisma.knowledgeEntry.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  try {
    const parsed = knowledgeEntrySchema.parse(await request.json());
    const entry = await prisma.knowledgeEntry.create({ data: { ...parsed, sourceUrl: parsed.sourceUrl || null } });
    await writeAuditLog({ actorType: "ADMIN", actorId: admin.adminId, action: "KNOWLEDGE_CREATE", targetType: "KnowledgeEntry", targetId: entry.id });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo nội dung kiến thức." }, { status: 400 });
  }
}
