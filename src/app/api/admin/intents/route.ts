import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { intentDefinitionSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();
  return NextResponse.json({ intents: await prisma.intentDefinition.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  assertSameOrigin(request);
  const body = intentDefinitionSchema.parse(await request.json());
  for (const value of [body.examples, body.keywords]) {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) throw new Error("Examples và keywords phải là mảng JSON chuỗi.");
  }
  const intent = await prisma.intentDefinition.create({ data: body });
  return NextResponse.json({ intent });
}
