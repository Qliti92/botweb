import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

export async function GET() {
  await requireAdmin();
  const messages = await prisma.unrecognizedMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ messages });
}

export async function PATCH(request: NextRequest) {
  await requireAdmin();
  assertSameOrigin(request);
  const body = (await request.json()) as { id?: string; isResolved?: boolean };
  if (!body.id) return NextResponse.json({ error: "Thiếu ID." }, { status: 400 });
  const message = await prisma.unrecognizedMessage.update({
    where: { id: body.id },
    data: { isResolved: body.isResolved ?? true }
  });
  return NextResponse.json({ message });
}
