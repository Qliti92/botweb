import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { classifyShoppingLink } from "@/lib/shopping-link";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { createCashbackLink } from "@/services/cashback-link";
import { loginWithOpenApi, type AuthSuccess } from "@/services/openapi-auth";
import { getSiteSettings } from "@/services/site-settings";

const schema = z.object({
  url: z.string().trim().min(1).max(2_000)
});

let previewAccount: { value: AuthSuccess; expiresAt: number; configKey: string } | null = null;
let previewLogin: Promise<AuthSuccess> | null = null;
let previewLoginKey = "";

function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

async function getPreviewAccount() {
  const settings = await getSiteSettings();
  if (!settings.cashbackPreviewEnabled) return null;
  const email = settings.cashbackPreviewEmail.trim();
  const encryptedPassword = settings.cashbackPreviewPassword;
  if (!email || !encryptedPassword) throw new Error("Admin chưa cấu hình đầy đủ tài khoản kiểm tra tiền hoàn.");
  const configKey = `${email}\0${encryptedPassword}`;

  if (previewAccount && previewAccount.configKey === configKey && previewAccount.expiresAt > Date.now()) {
    return previewAccount.value;
  }
  if (previewLogin && previewLoginKey === configKey) return previewLogin;

  previewLoginKey = configKey;
  previewLogin = loginWithOpenApi(email, decryptSecret(encryptedPassword), "QBot Cashback Preview")
    .then((result) => {
      if (result.status !== "success") {
        throw new Error("Tài khoản dùng thử yêu cầu xác minh bổ sung.");
      }
      previewAccount = { value: result, expiresAt: Date.now() + 45 * 60_000, configKey };
      return result;
    })
    .finally(() => {
      previewLogin = null;
      previewLoginKey = "";
    });

  return previewLogin;
}

export async function POST(request: NextRequest) {
  const visitorId = request.cookies.get("qbot_vid")?.value || requestIp(request);
  if (!rateLimit(`cashback-preview:${visitorId}`, 10, 60_000).ok) {
    return NextResponse.json(
      { error: "Bạn đã kiểm tra nhiều link liên tiếp. Vui lòng thử lại sau một phút." },
      { status: 429 }
    );
  }

  try {
    const body = schema.parse(await request.json());
    const link = classifyShoppingLink(body.url);
    if (link.kind !== "supported") {
      return NextResponse.json(
        { error: "Vui lòng dùng link sản phẩm Shopee hoặc TikTok Shop hợp lệ." },
        { status: 400 }
      );
    }

    const account = await getPreviewAccount();
    if (!account) {
      return NextResponse.json(
        { error: "Tính năng kiểm tra tiền hoàn chưa được bật. Vui lòng liên hệ hỗ trợ." },
        { status: 503 }
      );
    }

    const result = await createCashbackLink(
      link.url,
      account.token,
      account.tokenType,
      undefined,
      `preview:${account.user.id ?? account.user.email ?? "default"}`
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      preview: {
        productName: result.data.productName,
        productImage: result.data.productImage,
        productPrice: result.data.productPrice,
        cashbackAmount: result.data.cashbackAmount,
        platform: link.platform
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Link sản phẩm không hợp lệ." }, { status: 400 });
    }
    previewAccount = null;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chưa thể kiểm tra tiền hoàn." },
      { status: 500 }
    );
  }
}
