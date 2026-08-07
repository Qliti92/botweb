import { NextRequest } from "next/server";
import { sendWithdrawalOtp } from "@/services/openapi-member";
import { enforceWebViewRateLimit, requireWebViewBearer, webViewApiError, webViewSuccess } from "@/lib/webview-openapi";

export async function POST(request: NextRequest) {
  try {
    enforceWebViewRateLimit(request, "withdrawals-otp", 3, 10 * 60_000);
    return webViewSuccess(await sendWithdrawalOtp(requireWebViewBearer(request)));
  } catch (error) {
    return webViewApiError(error, "Không thể gửi mã OTP.");
  }
}
