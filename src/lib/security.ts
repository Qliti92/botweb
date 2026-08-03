import { NextRequest, NextResponse } from "next/server";

const sensitiveKeys = new Set(["token", "access_token", "authorization", "password", "password_confirmation", "current_password", "challenge_token"]);

export function securityHeaders(response: NextResponse) {
  const devScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", `default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'${devScriptPolicy} https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.facebook.com; frame-src https://www.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  return response;
}

export function assertSameOrigin(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return;

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    throw new Error("Nguon yeu cau khong hop le. Vui long tai lai trang admin.");
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Yeu cau thieu thong tin nguon. Vui long tai lai trang admin.");
    }
    return;
  }

  const firstHeaderValue = (value: string | null) => value?.split(",")[0]?.trim() ?? "";
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = firstHeaderValue(request.headers.get("host"));
  const requestUrl = new URL(request.url);
  let actual: URL;
  try {
    actual = new URL(origin);
  } catch {
    throw new Error("Nguon yeu cau khong hop le. Vui long tai lai trang admin.");
  }

  function normalizedHost(value: string) {
    try {
      const parsed = value.includes("://") ? new URL(value) : new URL(`https://${value}`);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      const defaultPort = parsed.port === "80" || parsed.port === "443";
      return `${hostname}${parsed.port && !defaultPort ? `:${parsed.port}` : ""}`;
    } catch {
      return "";
    }
  }

  const allowedHosts = new Set<string>();
  for (const candidate of [
    forwardedHost,
    host,
    requestUrl.host,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(",")
  ]) {
    const normalized = normalizedHost(candidate?.trim() ?? "");
    if (normalized) allowedHosts.add(normalized);
  }

  const actualHost = normalizedHost(actual.origin);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const isLocalAlias =
    process.env.NODE_ENV !== "production" &&
    localHosts.has(requestUrl.hostname) &&
    localHosts.has(actual.hostname) &&
    requestUrl.port === actual.port;

  if (!allowedHosts.has(actualHost) && !isLocalAlias) {
    throw new Error("Nguon yeu cau khong hop le. Vui long tai lai trang admin tu dung ten mien.");
  }
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sensitiveKeys.has(key.toLowerCase()) ? "[REDACTED]" : redactValue(entry)])
  );
}

export function redactSensitive(value: unknown) {
  return redactValue(value);
}

export function safeLogJson(value: unknown, maxLength = 4000) {
  const text = JSON.stringify(redactValue(value));
  return text.length > maxLength ? `${text.slice(0, maxLength)}...[TRUNCATED]` : text;
}

export function safeLogText(value: string, maxLength = 4000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...[TRUNCATED]` : value;
}
