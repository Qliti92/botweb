import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const cookieName = "admin_token";

function getSecret() {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(adminId: string, email: string) {
  return new SignJWT({ adminId, email })
    .setProtectedHeader({ alg: "HS256" })
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
    const { payload } = await jwtVerify(token, getSecret());
    return {
      adminId: String(payload.adminId),
      email: String(payload.email)
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
