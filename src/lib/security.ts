import { NextRequest, NextResponse } from "next/server";

const sensitiveKeys = new Set(["token", "access_token", "authorization", "password", "password_confirmation", "current_password", "challenge_token"]);

export function securityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return response;
}

export function assertSameOrigin(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  const expected = new URL(request.url);
  const actual = new URL(origin);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const isLocalAlias =
    process.env.NODE_ENV !== "production" &&
    localHosts.has(expected.hostname) &&
    localHosts.has(actual.hostname) &&
    expected.port === actual.port;

  if (actual.origin !== expected.origin && !isLocalAlias) {
    throw new Error("Nguon yeu cau khong hop le. Vui long mo admin cung dia chi voi server.");
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
