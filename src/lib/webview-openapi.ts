import { NextRequest, NextResponse } from "next/server";
import { OpenApiMemberError } from "@/services/openapi-member";
import { rateLimit } from "@/lib/rate-limit";

export function requireWebViewBearer(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match?.[1]) {
    throw new OpenApiMemberError("Phiên đăng nhập không hợp lệ. Vui lòng mở lại từ ứng dụng.", 401);
  }
  if (match[1].length > 8192) {
    throw new OpenApiMemberError("Token không hợp lệ.", 401);
  }
  return match[1];
}

export function enforceWebViewRateLimit(request: NextRequest, scope: string, limit: number, windowMs: number) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "local";
  if (!rateLimit(`webview:${scope}:${ip}`, limit, windowMs).ok) {
    throw new OpenApiMemberError("Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.", 429);
  }
}

export function webViewApiError(error: unknown, fallback: string) {
  if (error instanceof OpenApiMemberError) {
    const status = [400, 401, 403, 404, 409, 422, 429, 502, 503, 504].includes(error.status) ? error.status : 502;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, message: "Dữ liệu gửi lên không đúng định dạng." }, { status: 400 });
  }
  return NextResponse.json({ success: false, message: fallback }, { status: 500 });
}

export function webViewSuccess(data: unknown) {
  return NextResponse.json({ success: true, data });
}
