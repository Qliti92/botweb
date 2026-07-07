import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  return NextResponse.json({ users: [], message: "User được quản lý bởi API Hoàn Tiền Mua Hàng." });
}
