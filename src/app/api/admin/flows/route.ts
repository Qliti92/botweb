import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { flowSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();
  const flows = await prisma.conversationFlow.findMany({ include: { api: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ flows });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  assertSameOrigin(request);
  try {
    const body = flowSchema.parse(await request.json());
    const flow = await prisma.conversationFlow.create({ data: body });
    return NextResponse.json({ flow });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo kịch bản." }, { status: 400 });
  }
}
