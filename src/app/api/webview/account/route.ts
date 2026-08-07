import { NextRequest } from "next/server";
import { getAccount } from "@/services/openapi-member";
import { enforceWebViewRateLimit, requireWebViewBearer, webViewApiError, webViewSuccess } from "@/lib/webview-openapi";

export async function GET(request: NextRequest) {
  try {
    enforceWebViewRateLimit(request, "account", 30, 60_000);
    return webViewSuccess(await getAccount(requireWebViewBearer(request)));
  } catch (error) {
    return webViewApiError(error, "Không thể tải thông tin tài khoản.");
  }
}
