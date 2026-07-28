import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  stage: z.enum(["STARTED", "STEP_2", "ABANDONED", "FAILED"]),
  path: z.string().trim().max(300).default("/"),
  step: z.number().int().min(1).max(2).optional(),
  errorCategory: z.enum(["EMAIL_EXISTS", "INVALID_INPUT", "REFERRAL", "NETWORK", "SERVER", "OTHER"]).optional()
});

function deviceFromUserAgent(value: string) {
  if (/iphone|ipad|ipod/i.test(value)) return "iPhone/iPad";
  if (/android/i.test(value)) return "Android";
  return "Máy tính";
}

export async function POST(request: NextRequest) {
  const visitorId = request.cookies.get("qbot_vid")?.value;
  if (!visitorId) return NextResponse.json({ ok: true });

  const limited = rateLimit(`registration-analytics:${visitorId}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ ok: true });

  try {
    const body = schema.parse(await request.json());
    const latestVisit = await prisma.auditLog.findFirst({
      where: { actorId: visitorId, action: "PAGE_VISIT" },
      orderBy: { createdAt: "desc" },
      select: { metadata: true }
    });
    let visitMetadata: Record<string, unknown> = {};
    try { visitMetadata = JSON.parse(latestVisit?.metadata || "{}") as Record<string, unknown>; } catch {}
    await writeAuditLog({
      actorType: "USER",
      actorId: visitorId,
      action: `WEB_REGISTRATION_${body.stage}`,
      targetType: "RegistrationFunnel",
      targetId: visitorId,
      metadata: {
        path: body.path,
        step: body.step,
        source: String(visitMetadata.source || "Trực tiếp"),
        device: deviceFromUserAgent(request.headers.get("user-agent") || ""),
        errorCategory: body.errorCategory
      }
    });
  } catch {
    // Analytics must never block the registration experience.
  }

  return NextResponse.json({ ok: true });
}
