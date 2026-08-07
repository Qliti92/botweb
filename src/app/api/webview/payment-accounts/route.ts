import { NextRequest } from "next/server";
import { z } from "zod";
import { createPaymentAccount, getPaymentAccounts } from "@/services/openapi-member";
import { enforceWebViewRateLimit, requireWebViewBearer, webViewApiError, webViewSuccess } from "@/lib/webview-openapi";

const createSchema = z.object({
  payment_method: z.enum(["bank", "wallet"]),
  bank_name: z.string().trim().min(2).max(100),
  account_number: z.string().trim().min(3).max(30),
  account_name: z.string().trim().min(2).max(120),
  is_default: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    enforceWebViewRateLimit(request, "payment-accounts-read", 30, 60_000);
    return webViewSuccess(await getPaymentAccounts(requireWebViewBearer(request)));
  } catch (error) {
    return webViewApiError(error, "Không thể tải sổ tài khoản nhận tiền.");
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceWebViewRateLimit(request, "payment-accounts-create", 5, 60_000);
    const token = requireWebViewBearer(request);
    const body = createSchema.parse(await request.json());
    return webViewSuccess(await createPaymentAccount(token, undefined, {
      ...body,
      account_name: body.account_name.toUpperCase()
    }));
  } catch (error) {
    if (error instanceof z.ZodError) return webViewApiError(new SyntaxError(), "Dữ liệu tài khoản không hợp lệ.");
    return webViewApiError(error, "Không thể lưu tài khoản nhận tiền.");
  }
}
