import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { appNoticeSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();
  const notices = await prisma.appNotice.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ notices });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    assertSameOrigin(request);
    const body = appNoticeSchema.parse(await request.json());
    const notice = await prisma.appNotice.create({ data: body });
    return NextResponse.json({ notice });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Khong the tao thong bao." }, { status: 400 });
  }
}
