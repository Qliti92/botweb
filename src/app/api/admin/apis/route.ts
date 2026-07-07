import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { apiConfigSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();
  const apis = await prisma.apiConfig.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ apis });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  assertSameOrigin(request);
  try {
    const body = apiConfigSchema.parse(await request.json());
    const api = await prisma.apiConfig.create({ data: body });
    return NextResponse.json({ api });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo API." }, { status: 400 });
  }
}
