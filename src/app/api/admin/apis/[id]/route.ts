import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { apiConfigSchema } from "@/lib/validators";
import { encryptSecret } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  try {
    const { id } = await params;
    const body = apiConfigSchema.parse(await request.json());
    const api = await prisma.apiConfig.update({ where: { id }, data: { ...body, headers: encryptSecret(body.headers) } });
    await writeAuditLog({ actorType: "ADMIN", actorId: admin.adminId, action: "API_CONFIG_UPDATE", targetType: "ApiConfig", targetId: api.id });
    return NextResponse.json({ api: { ...api, headers: body.headers } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật API." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  const { id } = await params;
  await prisma.apiConfig.delete({ where: { id } });
  await writeAuditLog({ actorType: "ADMIN", actorId: admin.adminId, action: "API_CONFIG_DELETE", targetType: "ApiConfig", targetId: id });
  return NextResponse.json({ ok: true });
}
