import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { knowledgeEntrySchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  try {
    const { id } = await params;
    const parsed = knowledgeEntrySchema.parse(await request.json());
    const entry = await prisma.knowledgeEntry.update({ where: { id }, data: { ...parsed, sourceUrl: parsed.sourceUrl || null } });
    await writeAuditLog({ actorType: "ADMIN", actorId: admin.adminId, action: "KNOWLEDGE_UPDATE", targetType: "KnowledgeEntry", targetId: id });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật nội dung kiến thức." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  const { id } = await params;
  await prisma.knowledgeEntry.delete({ where: { id } });
  await writeAuditLog({ actorType: "ADMIN", actorId: admin.adminId, action: "KNOWLEDGE_DELETE", targetType: "KnowledgeEntry", targetId: id });
  return NextResponse.json({ ok: true });
}
