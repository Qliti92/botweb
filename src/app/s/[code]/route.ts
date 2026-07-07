import { NextRequest, NextResponse } from "next/server";
import { resolveShortLink } from "@/services/short-link";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await resolveShortLink(code);

  if (!link) {
    return new NextResponse("Short link not found", { status: 404 });
  }

  return NextResponse.redirect(link.originalUrl, 302);
}
