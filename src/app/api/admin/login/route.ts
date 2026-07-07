import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validators";
import { createAdminToken, setAdminCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`admin-login:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Bạn thử đăng nhập quá nhanh. Vui lòng chờ một chút." }, { status: 429 });
  }

  try {
    const body = adminLoginSchema.parse(await request.json());
    const admin = await prisma.admin.findUnique({ where: { email: body.email } });
    const valid = admin ? await bcrypt.compare(body.password, admin.passwordHash) : false;

    if (!admin || !valid) {
      return NextResponse.json({ error: "Email hoặc mật khẩu admin không đúng." }, { status: 401 });
    }

    await setAdminCookie(await createAdminToken(admin.id, admin.email));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể đăng nhập." }, { status: 400 });
  }
}
