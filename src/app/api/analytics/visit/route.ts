import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("start"),
    visitorId: z.string().uuid(),
    path: z.string().trim().min(1).max(500),
    referrer: z.string().trim().max(2000).optional().default("")
  }),
  z.object({
    mode: z.literal("update"),
    visitorId: z.string().uuid(),
    visitId: z.string().min(1),
    durationSeconds: z.number().int().min(0).max(86_400),
    interacted: z.boolean()
  })
]);

function sourceFromReferrer(referrer: string) {
  if (!referrer) return "Trực tiếp";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "Google";
    if (host.includes("tiktok.")) return "TikTok";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("shopee.")) return "Shopee";
    return host;
  } catch {
    return "Khác";
  }
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (body.mode === "start") {
      const visit = await prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          actorId: body.visitorId,
          action: "PAGE_VISIT",
          targetType: "Page",
          targetId: body.path,
          metadata: JSON.stringify({
            path: body.path,
            referrer: body.referrer,
            source: sourceFromReferrer(body.referrer),
            durationSeconds: 0,
            interacted: false
          })
        },
        select: { id: true }
      });
      return NextResponse.json({ visitId: visit.id });
    }

    const current = await prisma.auditLog.findFirst({
      where: { id: body.visitId, actorId: body.visitorId, action: "PAGE_VISIT" },
      select: { metadata: true }
    });
    if (!current) return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(current.metadata || "{}") as Record<string, unknown>; } catch {}
    await prisma.auditLog.update({
      where: { id: body.visitId },
      data: { metadata: JSON.stringify({ ...metadata, durationSeconds: body.durationSeconds, interacted: body.interacted }) }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }
}
