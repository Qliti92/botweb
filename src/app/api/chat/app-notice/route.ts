import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`chat-app-notice:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Ban thao tac qua nhanh. Vui long thu lai sau." }, { status: 429 });
  }

  const notice = await prisma.appNotice.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, message: true, displaySeconds: true, updatedAt: true }
  });

  return NextResponse.json({ notice });
}
