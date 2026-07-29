import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validators";
import { createAdminToken, setAdminCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

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
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Dữ liệu đăng nhập không đúng định dạng." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      const field = String(error.issues[0]?.path[0] ?? "");
      return NextResponse.json({
        error: field === "email"
          ? "Vui lòng nhập tài khoản admin."
          : field === "password"
            ? "Vui lòng nhập mật khẩu."
            : "Thông tin đăng nhập chưa hợp lệ."
      }, { status: 400 });
    }
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." }, { status: 500 });
  }
}
