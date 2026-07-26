import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/services/site-settings";
import { normalizeReferralDomain } from "@/services/referral-domain";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const settings = await getSiteSettings();
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: ["REFERRAL_DOMAIN_VISIT", "REFERRAL_DOMAIN_REGISTER"] } },
    orderBy: { createdAt: "desc" },
    select: { action: true, targetId: true, createdAt: true }
  });
  const stats = new Map<string, { visits: number; registrations: number; lastVisitAt: Date | null; lastRegistrationAt: Date | null }>();
  for (const log of logs) {
    const domain = normalizeReferralDomain(log.targetId || "");
    if (!domain) continue;
    const current = stats.get(domain) ?? { visits: 0, registrations: 0, lastVisitAt: null, lastRegistrationAt: null };
    if (log.action === "REFERRAL_DOMAIN_VISIT") {
      current.visits += 1;
      current.lastVisitAt ??= log.createdAt;
    } else {
      current.registrations += 1;
      current.lastRegistrationAt ??= log.createdAt;
    }
    stats.set(domain, current);
  }
  return NextResponse.json({
    domains: settings.referralDomains.map((item) => ({
      ...item,
      ...(stats.get(normalizeReferralDomain(item.domain)) ?? { visits: 0, registrations: 0, lastVisitAt: null, lastRegistrationAt: null })
    }))
  });
}
