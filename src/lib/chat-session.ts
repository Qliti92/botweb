import { jwtVerify, SignJWT } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { requireServerSecret } from "@/lib/secrets";

const cookieName = "chat_session";

function secret() {
  return new TextEncoder().encode(requireServerSecret("JWT_SECRET"));
}

export async function readChatSessionId(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return typeof payload.sessionId === "string" ? payload.sessionId : null;
  } catch {
    return null;
  }
}

export async function setChatSessionCookie(response: NextResponse, sessionId: string) {
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

export async function requireMatchingChatSession(request: NextRequest, requestedId?: string | null) {
  const cookieSessionId = await readChatSessionId(request);
  if (!cookieSessionId || (requestedId && cookieSessionId !== requestedId)) {
    throw new Error("Phiên chat không hợp lệ hoặc đã hết hạn.");
  }
  return cookieSessionId;
}
