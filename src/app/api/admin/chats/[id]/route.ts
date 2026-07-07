import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  assertSameOrigin(request);
  const { id } = await params;

  try {
    await prisma.chatSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy phiên chat." }, { status: 404 });
  }
}
