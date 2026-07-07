import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { securityHeaders } from "@/lib/security";

const protectedPaths = ["/admin"];

export async function middleware(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!isProtected || isLogin) return securityHeaders(NextResponse.next());

  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
    await jwtVerify(token, secret);
    return securityHeaders(NextResponse.next());
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/:path*"]
};
