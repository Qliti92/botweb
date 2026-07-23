import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { apiConfigSchema } from "@/lib/validators";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  await requireAdmin();
  const storedApis = await prisma.apiConfig.findMany({ orderBy: { createdAt: "desc" } });
  const apis = storedApis.map((api) => ({ ...api, headers: decryptSecret(api.headers) }));
  return NextResponse.json({ apis });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  assertSameOrigin(request);
  try {
    const body = apiConfigSchema.parse(await request.json());
    const api = await prisma.apiConfig.create({ data: { ...body, headers: encryptSecret(body.headers) } });
    await writeAuditLog({ actorType: "ADMIN", actorId: admin.adminId, action: "API_CONFIG_CREATE", targetType: "ApiConfig", targetId: api.id });
    return NextResponse.json({ api: { ...api, headers: body.headers } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo API." }, { status: 400 });
  }
}
