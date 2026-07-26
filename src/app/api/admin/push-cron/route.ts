import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";
import { processDuePushCampaigns } from "@/services/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function appOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "https://qbot.vn").origin;
  } catch {
    return "https://qbot.vn";
  }
}

export async function GET() {
  await requireAdmin();
  const appDir = process.cwd();
  const endpoint = `${appOrigin()}/api/cron/push`;
  const command = `cd ${shellQuote(appDir)} || exit 1
CRON_SECRET=$(sed -n 's/^CRON_SECRET="\\?\\([^"]*\\)"\\?$/\\1/p' .env.production)
test -n "$CRON_SECRET" || { echo "Chưa có CRON_SECRET trong .env.production"; exit 1; }
(
  crontab -l 2>/dev/null | grep -v '/api/cron/push'
  echo "* * * * * /usr/bin/curl -fsS --max-time 50 -H \\"Authorization: Bearer $CRON_SECRET\\" ${endpoint} >/dev/null 2>>/var/log/botweb-cron-error.log"
) | crontab -
crontab -l | grep '/api/cron/push'`;

  return NextResponse.json({
    configured: Boolean(process.env.CRON_SECRET),
    endpoint,
    command
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  try {
    assertSameOrigin(request);
    const results = await processDuePushCampaigns();
    await writeAuditLog({
      actorType: "ADMIN",
      actorId: admin.adminId,
      action: "PUSH_CRON_RUN_MANUALLY",
      targetType: "PushCron",
      targetId: "manual"
    });
    return NextResponse.json({ success: true, processed: results.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể chạy thử cron." }, { status: 500 });
  }
}
