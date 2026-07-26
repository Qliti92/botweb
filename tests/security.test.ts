import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { assertSameOrigin } from "../src/lib/security";

function request(origin: string, headers: Record<string, string> = {}) {
  return new NextRequest("http://127.0.0.1:3000/api/admin/site-settings", {
    method: "POST",
    headers: { origin, ...headers }
  });
}

assert.doesNotThrow(() => assertSameOrigin(request("https://qbot.vn", { host: "qbot.vn" })));
assert.doesNotThrow(() => assertSameOrigin(request("https://www.qbot.vn", { host: "qbot.vn" })));
assert.doesNotThrow(() => assertSameOrigin(request("https://tranquan.vn", { "x-forwarded-host": "tranquan.vn" })));
assert.throws(() => assertSameOrigin(request("https://evil.example", { host: "qbot.vn" })), /Nguon yeu cau khong hop le/);

console.log("Same-origin security tests passed");
