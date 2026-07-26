import assert from "node:assert/strict";
import { registerWithOpenApi } from "../src/services/openapi-auth";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

async function main() {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return response({ success: true, data: { token: "token-123", token_type: "Bearer", user: { id: 1, email: "demo@gmail.com" } } });
  };
  const success = await registerWithOpenApi({ email: "demo@gmail.com", password: "secret123", passwordConfirmation: "secret123" });
  assert.equal(success.status, "success");
  assert.equal(success.token, "token-123");
  assert.equal(calls, 1);

  globalThis.fetch = async () => response({ success: true, data: { email_verification_required: true, email: "demo@gmail.com" } });
  const verification = await registerWithOpenApi({ email: "demo@gmail.com", password: "secret123", passwordConfirmation: "secret123" });
  assert.equal(verification.status, "verify-email");

  calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return response({ success: true, message: "Đã tạo tài khoản", data: { user: { id: 1 } } });
  };
  await assert.rejects(
    () => registerWithOpenApi({ email: "demo@gmail.com", password: "secret123", passwordConfirmation: "secret123" }),
    /không trả access token/
  );
  assert.equal(calls, 1, "Không được tự đăng nhập để suy đoán đăng ký thành công.");

  console.log("OpenAPI registration tests passed.");
}

void main();
