import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { securityHeaders } from "@/lib/security";
import { requireServerSecret } from "@/lib/secrets";

const protectedPaths = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isLogin = request.nextUrl.pathname === "/admin/login" || request.nextUrl.pathname === "/api/admin/login";
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");

  if (!isProtected || isLogin) return securityHeaders(NextResponse.next());

  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return isAdminApi
      ? securityHeaders(NextResponse.json({ error: "Vui long dang nhap admin." }, { status: 401 }))
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(requireServerSecret("JWT_SECRET"));
    await jwtVerify(token, secret);
    return securityHeaders(NextResponse.next());
  } catch {
    return isAdminApi
      ? securityHeaders(NextResponse.json({ error: "Phien admin da het han. Vui long dang nhap lai." }, { status: 401 }))
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/:path*"]
};
