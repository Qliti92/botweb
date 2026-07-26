import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { securityHeaders } from "@/lib/security";
import { requireServerSecret } from "@/lib/secrets";

const protectedPaths = ["/admin", "/api/admin"];

function finalizeResponse(request: NextRequest, response: NextResponse) {
  const sensitiveResponse =
    request.nextUrl.pathname.startsWith("/api/chat") ||
    request.nextUrl.pathname.startsWith("/api/admin");

  if (sensitiveResponse) {
    response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  }

  return securityHeaders(response);
}

export async function middleware(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isLogin = request.nextUrl.pathname === "/admin/login" || request.nextUrl.pathname === "/api/admin/login";
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");

  if (!isProtected || isLogin) return finalizeResponse(request, NextResponse.next());

  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return isAdminApi
      ? finalizeResponse(request, NextResponse.json({ error: "Vui long dang nhap admin." }, { status: 401 }))
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(requireServerSecret("JWT_SECRET"));
    await jwtVerify(token, secret);
    return finalizeResponse(request, NextResponse.next());
  } catch {
    return isAdminApi
      ? finalizeResponse(request, NextResponse.json({ error: "Phien admin da het han. Vui long dang nhap lai." }, { status: 401 }))
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/:path*"]
};
