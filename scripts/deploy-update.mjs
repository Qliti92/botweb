import { execFileSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const appDir = resolve(process.env.DEPLOY_APP_DIR || process.cwd());
const statusFile = process.env.DEPLOY_STATUS_FILE || "/var/lib/botweb/deploy-status.json";
const lockFile = `${statusFile}.lock`;
const pm2AppName = process.env.PM2_APP_NAME || "botweb";
const logs = [];
let lockFd;
let ownsLock = false;

function save(status, step, message, extra = {}) {
  mkdirSync(dirname(statusFile), { recursive: true });
  writeFileSync(statusFile, JSON.stringify({
    status, step, message, logs: logs.slice(-40), updatedAt: new Date().toISOString(), ...extra
  }, null, 2));
}

function run(command, args, step, message) {
  save("running", step, message);
  const output = execFileSync(command, args, {
    cwd: appDir, encoding: "utf8", env: process.env, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 20 * 1024 * 1024
  });
  if (output.trim()) logs.push(...output.trim().split(/\r?\n/).slice(-12));
  return output.trim();
}

try {
  mkdirSync(dirname(statusFile), { recursive: true });
  try {
    lockFd = openSync(lockFile, "wx");
    ownsLock = true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") process.exit(0);
    throw error;
  }
  const beforeCommit = run("git", ["rev-parse", "--short", "HEAD"], "checking", "Đang kiểm tra phiên bản hiện tại…");
  const dirty = run("git", ["status", "--porcelain"], "checking", "Đang kiểm tra thư mục dự án…");
  if (dirty) throw new Error("Server có file mã nguồn đang thay đổi. Hãy xử lý các file này trước khi cập nhật.");

  run("git", ["fetch", "origin", "main"], "downloading", "Đang tải thông tin phiên bản mới…");
  const remoteCommit = run("git", ["rev-parse", "--short", "origin/main"], "checking", "Đã tìm thấy phiên bản trên GitHub.");
  if (beforeCommit === remoteCommit) {
    save("success", "complete", "Server đang chạy phiên bản mới nhất.", { beforeCommit, currentCommit: beforeCommit });
  } else {
    run("git", ["merge", "--ff-only", "origin/main"], "updating", "Đang cập nhật mã nguồn…");
    run(process.platform === "win32" ? "npm.cmd" : "npm", ["ci"], "installing", "Đang cài đặt thư viện…");
    run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], "building", "Đang tạo bản chạy mới…");
    const currentCommit = run("git", ["rev-parse", "--short", "HEAD"], "restarting", "Build thành công. Đang khởi động lại website…");
    save("restarting", "restarting", "Đang khởi động lại website…", { beforeCommit, currentCommit });
    run("pm2", ["restart", pm2AppName, "--update-env"], "restarting", "Đang khởi động lại website…");
    run("pm2", ["save"], "saving", "Đang lưu cấu hình PM2…");
    save("success", "complete", "Cập nhật thành công.", { beforeCommit, currentCommit });
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (error && typeof error === "object") {
    const stderr = "stderr" in error ? String(error.stderr || "").trim() : "";
    const stdout = "stdout" in error ? String(error.stdout || "").trim() : "";
    if (stdout) logs.push(...stdout.split(/\r?\n/).slice(-10));
    if (stderr) logs.push(...stderr.split(/\r?\n/).slice(-10));
  }
  save("failed", "failed", message, { error: message });
  process.exitCode = 1;
} finally {
  if (lockFd !== undefined) closeSync(lockFd);
  if (ownsLock) {
    try { unlinkSync(lockFile); } catch {}
  }
}
