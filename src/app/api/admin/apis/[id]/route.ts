import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { apiConfigSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  assertSameOrigin(request);
  try {
    const { id } = await params;
    const body = apiConfigSchema.parse(await request.json());
    const api = await prisma.apiConfig.update({ where: { id }, data: body });
    return NextResponse.json({ api });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật API." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  assertSameOrigin(request);
  const { id } = await params;
  await prisma.apiConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
