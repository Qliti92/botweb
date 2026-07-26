import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const statusFile = process.env.DEPLOY_STATUS_FILE || "/var/lib/botweb/deploy-status.json";

type DeploymentStatus = {
  status: "idle" | "running" | "restarting" | "success" | "failed";
  message: string;
  logs?: string[];
  updatedAt?: string;
  beforeCommit?: string;
  currentCommit?: string;
  error?: string;
};

async function currentCommit() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--short", "HEAD"], { cwd: process.cwd() });
    return stdout.trim();
  } catch {
    return "không xác định";
  }
}

async function readStatus(): Promise<DeploymentStatus> {
  try {
    return JSON.parse(await readFile(statusFile, "utf8")) as DeploymentStatus;
  } catch {
    return { status: "idle", message: "Chưa có lần cập nhật nào." };
  }
}

export async function GET() {
  await requireAdmin();
  return NextResponse.json({
    enabled: process.env.ADMIN_DEPLOY_ENABLED === "true",
    platformSupported: process.platform !== "win32",
    currentCommit: await currentCommit(),
    deployment: await readStatus()
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  try {
    assertSameOrigin(request);
    if (process.env.ADMIN_DEPLOY_ENABLED !== "true") {
      return NextResponse.json({ error: "Chức năng cập nhật chưa được bật trên server." }, { status: 403 });
    }
    if (process.platform === "win32") {
      return NextResponse.json({ error: "Chức năng này chỉ chạy trên server Linux." }, { status: 400 });
    }
    const status = await readStatus();
    const statusAge = status.updatedAt ? Date.now() - new Date(status.updatedAt).getTime() : Number.POSITIVE_INFINITY;
    if ((status.status === "running" || status.status === "restarting") && statusAge < 30 * 60 * 1000) {
      return NextResponse.json({ error: "Một bản cập nhật đang được thực hiện." }, { status: 409 });
    }

    const child = spawn(process.execPath, [`${process.cwd()}/scripts/deploy-update.mjs`], {
      cwd: process.cwd(), detached: true, stdio: "ignore", env: { ...process.env, DEPLOY_APP_DIR: process.cwd() }
    });
    child.unref();
    await writeAuditLog({
      actorType: "ADMIN", actorId: admin.adminId, action: "DEPLOYMENT_UPDATE_START",
      targetType: "Application", targetId: process.env.PM2_APP_NAME || "botweb"
    });
    return NextResponse.json({ started: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể bắt đầu cập nhật." }, { status: 400 });
  }
}
