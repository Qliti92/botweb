import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { appNoticeSchema } from "@/lib/validators";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const body = appNoticeSchema.parse(await request.json());
    const notice = await prisma.appNotice.update({ where: { id }, data: body });
    return NextResponse.json({ notice });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Khong the cap nhat thong bao." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const { id } = await params;
    await prisma.appNotice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Khong the xoa thong bao." }, { status: 400 });
  }
}
