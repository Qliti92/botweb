import { NextRequest } from "next/server";
import { z } from "zod";
import { createWithdrawal, getWithdrawals, OpenApiMemberError } from "@/services/openapi-member";
import { enforceWebViewRateLimit, requireWebViewBearer, webViewApiError, webViewSuccess } from "@/lib/webview-openapi";

const withdrawalSchema = z.object({
  amount: z.number().int().min(10_000).max(1_000_000_000),
  payment_method: z.enum(["bank", "wallet", "momo"]),
  bank_name: z.string().trim().max(100).optional(),
  wallet_name: z.string().trim().max(100).optional(),
  account_number: z.string().trim().min(3).max(30),
  account_name: z.string().trim().min(2).max(120),
  otp_code: z.string().trim().max(20).optional()
});

export async function GET(request: NextRequest) {
  try {
    enforceWebViewRateLimit(request, "withdrawals-read", 30, 60_000);
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    return webViewSuccess(await getWithdrawals(requireWebViewBearer(request), undefined, page, 10));
  } catch (error) {
    return webViewApiError(error, "Không thể tải lịch sử rút tiền.");
  }
}

export async function POST(request: NextRequest) {
  try {
    enforceWebViewRateLimit(request, "withdrawals-create", 3, 60_000);
    const token = requireWebViewBearer(request);
    const body = withdrawalSchema.parse(await request.json());
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey || !z.string().uuid().safeParse(idempotencyKey).success) {
      throw new OpenApiMemberError("Yêu cầu rút tiền thiếu mã chống gửi trùng hợp lệ.", 400);
    }
    return webViewSuccess(await createWithdrawal(token, undefined, body, idempotencyKey));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const field = String(issue?.path[0] ?? "");
      const messages: Record<string, string> = {
        amount: "Số tiền rút tối thiểu là 10.000 VNĐ.",
        payment_method: "Hình thức nhận tiền không hợp lệ.",
        bank_name: "Vui lòng chọn ngân hàng nhận tiền.",
        wallet_name: "Vui lòng chọn ví điện tử nhận tiền.",
        account_number: "Số tài khoản nhận tiền không hợp lệ.",
        account_name: "Tên chủ tài khoản không hợp lệ.",
        otp_code: "Mã OTP không hợp lệ."
      };
      return webViewApiError(new OpenApiMemberError(messages[field] ?? "Thông tin rút tiền chưa đầy đủ.", 400), "Thông tin rút tiền không hợp lệ.");
    }
    return webViewApiError(error, "Không thể tạo yêu cầu rút tiền.");
  }
}
