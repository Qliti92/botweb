import { NextResponse } from "next/server";
import { getSiteSettings } from "@/services/site-settings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({
    autoSubmitShoppingLinks: settings.autoSubmitShoppingLinks
  });
}
