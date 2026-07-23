import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { intentDefinitionSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  assertSameOrigin(request);
  const { id } = await params;
  const body = intentDefinitionSchema.parse(await request.json());
  const intent = await prisma.intentDefinition.update({ where: { id }, data: body });
  return NextResponse.json({ intent });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  assertSameOrigin(request);
  const { id } = await params;
  await prisma.intentDefinition.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
