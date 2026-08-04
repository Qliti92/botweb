import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { safeLogJson } from "@/lib/security";

const schema = z.object({
  stage: z.enum(["LINK_ENTERED", "STARTED", "STEP_2", "ABANDONED", "FAILED"]),
  path: z.string().trim().max(300).default("/"),
  step: z.number().int().min(1).max(3).optional(),
  errorCategory: z.enum(["EMAIL_EXISTS", "INVALID_INPUT", "REFERRAL", "NETWORK", "RATE_LIMIT", "SERVER", "OTHER"]).optional(),
  errorCode: z.string().trim().max(80).optional(),
  errorMessage: z.string().trim().max(500).optional(),
  apiResponse: z.string().trim().max(2_000).optional(),
  httpStatus: z.number().int().min(0).max(599).optional(),
  context: z.enum(["MAIN_REGISTER", "LINK_REGISTER"]).optional(),
  attemptId: z.string().trim().max(80).optional(),
  inputSnapshot: z.object({
    email: z.string().trim().max(200).optional(),
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    referralCode: z.string().trim().max(100).optional()
  }).optional()
});

function sanitizeErrorMessage(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/(?:\+?84|0)\d{8,10}/g, "[số điện thoại]")
    .replace(/\b\d{6}\b/g, "[mã]")
    .slice(0, 240);
}

function sanitizeApiResponse(value?: string) {
  if (!value) return undefined;
  try {
    return sanitizeErrorMessage(safeLogJson(JSON.parse(value), 1_200));
  } catch {
    return sanitizeErrorMessage(value)?.slice(0, 1_200);
  }
}

function deviceFromUserAgent(value: string) {
  if (/iphone|ipad|ipod/i.test(value)) return "iPhone/iPad";
  if (/android/i.test(value)) return "Android";
  return "Máy tính";
}

function maskRegistrationInput(input?: { email?: string; name?: string; phone?: string; referralCode?: string }) {
  if (!input) return undefined;
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.replace(/\D/g, "");
  return {
    email: email || undefined,
    name: input.name?.trim() || undefined,
    phone: phone ? `${"*".repeat(Math.max(0, phone.length - 3))}${phone.slice(-3)}` : undefined,
    referralCode: input.referralCode?.trim() || undefined
  };
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
        errorCategory: body.errorCategory,
        errorCode: body.errorCode,
        errorMessage: sanitizeErrorMessage(body.errorMessage),
        apiResponse: sanitizeApiResponse(body.apiResponse),
        httpStatus: body.httpStatus,
        context: body.context,
        attemptId: body.attemptId,
        inputSnapshot: maskRegistrationInput(body.inputSnapshot)
      }
    });
  } catch {
    // Analytics must never block the registration experience.
  }

  return NextResponse.json({ ok: true });
}
