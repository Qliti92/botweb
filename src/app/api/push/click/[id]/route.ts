import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const delivery = await prisma.pushDelivery.findUnique({ where: { id } });
  if (!delivery) return NextResponse.redirect(new URL("/", request.url));
  await prisma.pushDelivery.update({ where: { id }, data: { clickedAt: new Date() } }).catch(() => null);
  const target = delivery.actionUrl || "/";
  try {
    return NextResponse.redirect(new URL(target, request.url));
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
