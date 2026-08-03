import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { requireServerSecret } from "@/lib/secrets";
import { prisma } from "@/lib/prisma";

const cookieName = "admin_token";
const tokenIssuer = "webchat-admin";
const tokenAudience = "webchat-admin-session";

function getSecret() {
  const secret = requireServerSecret("JWT_SECRET");
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(adminId: string, email: string) {
  return new SignJWT({ adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(tokenIssuer)
    .setAudience(tokenAudience)
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: tokenIssuer,
      audience: tokenAudience
    });
    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string" ||
      payload.sub !== payload.adminId
    ) return null;

    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true }
    });
    if (!admin || admin.email !== payload.email) return null;

    return {
      adminId: admin.id,
      email: admin.email
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}
