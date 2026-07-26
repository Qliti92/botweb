import type { NextRequest } from "next/server";
import { getSiteSettings } from "@/services/site-settings";

export type ReferralAttribution = { domain: string; referralCode: string };

export function normalizeReferralDomain(value: string) {
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first) return "";
  try {
    const url = new URL(first.includes("://") ? first : `https://${first}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function environmentMappings() {
  try {
    const parsed = JSON.parse(process.env.REFERRAL_DOMAIN_MAP || "{}") as Record<string, unknown>;
    return Object.entries(parsed).flatMap(([domain, referralCode]) => {
      const normalized = normalizeReferralDomain(domain);
      return normalized && typeof referralCode === "string" && referralCode.trim()
        ? [{ domain: normalized, referralCode: referralCode.trim(), enabled: true }]
        : [];
    });
  } catch {
    return [];
  }
}

export async function resolveReferralDomain(request: NextRequest): Promise<ReferralAttribution | null> {
  const host = normalizeReferralDomain(request.headers.get("x-forwarded-host") || request.headers.get("host") || "");
  if (!host) return null;
  const settings = await getSiteSettings();
  const mappings = [...settings.referralDomains, ...environmentMappings()];
  const match = mappings.find((item) => item.enabled && normalizeReferralDomain(item.domain) === host && item.referralCode.trim());
  return match ? { domain: host, referralCode: match.referralCode.trim() } : null;
}
