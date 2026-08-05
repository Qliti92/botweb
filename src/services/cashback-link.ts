import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/redis";
import { safeLogJson, safeLogText } from "@/lib/security";
import { getSiteSettings } from "@/services/site-settings";

const cashbackEndpoint = "https://hoantienmuahang.vn/api/v1/openapi/cashback/link";
const defaultCashbackTimeoutMs = 30_000;

function cashbackTimeoutMs() {
  const configured = Number(process.env.CASHBACK_LINK_TIMEOUT_MS);
  if (!Number.isFinite(configured)) return defaultCashbackTimeoutMs;
  return Math.min(60_000, Math.max(10_000, Math.trunc(configured)));
}

export type CashbackLinkResult = {
  transId?: string;
  affiliateUrl: string;
  productPrice?: number | string;
  cashbackAmount?: number | string;
  productName?: string;
  productImage?: string;
};

type CashbackResponse =
  | { ok: true; data: CashbackLinkResult }
  | { ok: false; error: string };

const memoryCache = new Map<string, { expiresAt: number; result: CashbackLinkResult }>();
const inFlight = new Map<string, Promise<CashbackResponse>>();

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function friendlyCashbackError(status: number, message: string) {
  const normalized = message.toLowerCase();
  if (status === 401 || status === 403) return "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại rồi thử tạo link nhé.";
  if (status === 404 || normalized.includes("not found") || normalized.includes("không tồn tại")) {
    return "Không tìm thấy sản phẩm từ link này. Sản phẩm có thể đã bị gỡ hoặc link không còn hiệu lực.";
  }
  if (status === 422 || normalized.includes("invalid") || normalized.includes("không hợp lệ")) {
    return "Link này chưa trỏ tới một sản phẩm hợp lệ. Bạn mở sản phẩm trên Shopee/TikTok Shop rồi sao chép lại link nhé.";
  }
  if (status === 429) return "Hệ thống đang nhận nhiều yêu cầu. Link của bạn đã được giữ lại, vui lòng thử lại sau ít phút.";
  if (status >= 500) return "Shopee/TikTok đang phản hồi chậm. Link của bạn đã được giữ lại để thử lại.";
  return message || "Chưa thể tạo link hoàn tiền. Bạn có thể thử lại hoặc gửi yêu cầu hỗ trợ.";
}

function cacheKey(accountKey: string, url: string) {
  return `cashback:${createHash("sha256").update(`${accountKey}\0${url}`).digest("hex")}`;
}

function writeApiLog(data: Parameters<typeof prisma.apiLog.create>[0]["data"]) {
  void prisma.apiLog.create({ data }).catch((error) => {
    console.error("Không thể ghi API log:", error instanceof Error ? error.message : "Unknown error");
  });
}

async function readCachedResult(key: string) {
  const local = memoryCache.get(key);
  if (local && local.expiresAt > Date.now()) return local.result;
  if (local) memoryCache.delete(key);

  try {
    const stored = await redisGet(key);
    if (!stored) return null;
    return JSON.parse(stored) as CashbackLinkResult;
  } catch {
    return null;
  }
}

async function storeCachedResult(key: string, result: CashbackLinkResult, ttlSeconds: number) {
  if (ttlSeconds <= 0) return;
  if (memoryCache.size >= 500) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, result });
  try {
    await redisSet(key, JSON.stringify(result), ttlSeconds);
  } catch {
    // Redis is optional; the process-local cache remains available.
  }
}

async function requestCashbackLink(url: string, token: string, tokenType: string, sessionId?: string): Promise<CashbackResponse> {
  const request = { url };

  try {
    const response = await fetch(cashbackEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `${tokenType} ${token}`
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(cashbackTimeoutMs())
    });
    const text = await response.text();

    writeApiLog({
      sessionId,
      request: safeLogJson(request),
      response: safeLogText(text),
      statusCode: response.status
    });

    const json = asRecord(JSON.parse(text || "{}"));
    if (!response.ok || json.success === false) {
      return { ok: false as const, error: friendlyCashbackError(response.status, String(json.message ?? json.error ?? "")) };
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
        productPrice: (data.product_price ?? data.productPrice ?? data.price ?? data.sale_price ?? data.salePrice) as number | string | undefined,
        cashbackAmount: data.cashback_amount as number | string | undefined,
        productName: String(data.product_name ?? data.productName ?? data.title ?? data.name ?? "") || undefined,
        productImage: String(data.image ?? data.product_image ?? data.productImage ?? data.image_url ?? data.imageUrl ?? data.thumbnail ?? "") || undefined
      }
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "Shopee/TikTok phản hồi quá lâu. Link của bạn đã được giữ lại, hãy bấm thử lại."
      : friendlyCashbackError(0, rawMessage);
    writeApiLog({ sessionId, request: safeLogJson(request), error: safeLogText(message, 1000) });
    return { ok: false as const, error: message };
  }
}

export async function createCashbackLink(url: string, token: string, tokenType = "Bearer", sessionId?: string, accountKey = "anonymous") {
  const key = cacheKey(accountKey, url);
  const settings = await getSiteSettings();
  const ttlSeconds = settings.cashbackCacheSeconds;
  const cached = ttlSeconds > 0 ? await readCachedResult(key) : null;
  if (cached) return { ok: true as const, data: cached };

  const existing = inFlight.get(key);
  if (existing) return existing;

  const request = requestCashbackLink(url, token, tokenType, sessionId)
    .then(async (result) => {
      if (result.ok) await storeCachedResult(key, result.data, ttlSeconds);
      return result;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
