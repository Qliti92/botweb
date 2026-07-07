import { prisma } from "@/lib/prisma";
import { safeLogJson, safeLogText } from "@/lib/security";

const cashbackEndpoint = "https://hoantienmuahang.vn/api/v1/openapi/cashback/link";

export type CashbackLinkResult = {
  transId?: string;
  affiliateUrl: string;
  cashbackAmount?: number | string;
  productName?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function createCashbackLink(url: string, token: string, tokenType = "Bearer", sessionId?: string) {
  const request = { url };

  try {
    const response = await fetch(cashbackEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `${tokenType} ${token}`
      },
      body: JSON.stringify(request)
    });
    const text = await response.text();

    await prisma.apiLog.create({
      data: {
        sessionId,
        request: safeLogJson(request),
        response: safeLogText(text),
        statusCode: response.status
      }
    });

    const json = asRecord(JSON.parse(text || "{}"));
    if (!response.ok || json.success === false) {
      return { ok: false as const, error: String(json.message ?? json.error ?? "Không thể tạo link hoàn tiền.") };
    }

    const data = asRecord(json.data);
    const affiliateUrl = String(data.affiliate_url ?? data.affiliateUrl ?? "");
    if (!affiliateUrl) {
      return { ok: false as const, error: "API không trả link affiliate." };
    }

    return {
      ok: true as const,
      data: {
        transId: data.trans_id ? String(data.trans_id) : undefined,
        affiliateUrl,
        cashbackAmount: data.cashback_amount as number | string | undefined,
        productName: String(data.product_name ?? data.productName ?? data.title ?? data.name ?? "") || undefined
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo link hoàn tiền.";
    await prisma.apiLog.create({ data: { sessionId, request: safeLogJson(request), error: safeLogText(message, 1000) } });
    return { ok: false as const, error: message };
  }
}
