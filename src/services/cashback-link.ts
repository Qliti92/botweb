import { prisma } from "@/lib/prisma";
import { safeLogJson, safeLogText } from "@/lib/security";

const cashbackEndpoint = "https://hoantienmuahang.vn/api/v1/openapi/cashback/link";

export type CashbackLinkResult = {
  transId?: string;
  affiliateUrl: string;
  cashbackAmount?: number | string;
  productName?: string;
  productImage?: string;
};

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

export async function createCashbackLink(url: string, token: string, tokenType = "Bearer", sessionId?: string) {
  const request = { url };

  try {
    const response = await fetch(cashbackEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `${tokenType} ${token}`
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(15_000)
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
    await prisma.apiLog.create({ data: { sessionId, request: safeLogJson(request), error: safeLogText(message, 1000) } });
    return { ok: false as const, error: message };
  }
}
