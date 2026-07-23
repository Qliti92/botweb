import { NextResponse } from "next/server";
import { getSiteSettings } from "@/services/site-settings";

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!["logo", "avatar"].includes(kind)) return new NextResponse("Not found", { status: 404 });
  const settings = await getSiteSettings();
  const configured = kind === "avatar" ? settings.avatarUrl : settings.logoUrl;
  const target = new URL(configured || "/logo.png", request.url);
  const response = NextResponse.redirect(target, 307);
  response.headers.set("cache-control", "public, max-age=300, stale-while-revalidate=3600");
  return response;
}
