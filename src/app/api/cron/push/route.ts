import { NextRequest, NextResponse } from "next/server";
import { processDuePushCampaigns } from "@/services/web-push";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || supplied !== secret) return NextResponse.json({ error: "Không có quyền." }, { status: 401 });

  try {
    const results = await processDuePushCampaigns();
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cron push thất bại." }, { status: 500 });
  }
}
