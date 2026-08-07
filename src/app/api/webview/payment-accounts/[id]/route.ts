import { NextRequest } from "next/server";
import { deletePaymentAccount } from "@/services/openapi-member";
import { enforceWebViewRateLimit, requireWebViewBearer, webViewApiError, webViewSuccess } from "@/lib/webview-openapi";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    enforceWebViewRateLimit(request, "payment-accounts-delete", 10, 60_000);
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) return webViewApiError(new SyntaxError(), "Mã tài khoản không hợp lệ.");
    return webViewSuccess(await deletePaymentAccount(requireWebViewBearer(request), undefined, id));
  } catch (error) {
    return webViewApiError(error, "Không thể xóa tài khoản nhận tiền.");
  }
}
