import assert from "node:assert/strict";
import { AuthServiceError, loginWithOpenApi, registerWithOpenApi } from "../src/services/openapi-auth";
import { ApiResponseError, friendlyRequestError, readApiResponse } from "../src/lib/api-response";

const originalFetch = globalThis.fetch;

async function expectAuthError(run: () => Promise<unknown>, status: number, message: RegExp) {
  await assert.rejects(run, (error: unknown) => {
    assert.ok(error instanceof AuthServiceError);
    assert.equal(error.status, status);
    assert.match(error.message, message);
    return true;
  });
}

async function main() {
try {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ success: false, message: "Invalid data" }),
    { status: 401, headers: { "content-type": "application/json" } }
  );
  await expectAuthError(
    () => loginWithOpenApi("user@example.com", "wrong-password"),
    401,
    /Email hoặc mật khẩu/
  );

  globalThis.fetch = async () => new Response(
    JSON.stringify({ success: false, errors: { email: ["already exists"] } }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
  await expectAuthError(
    () => registerWithOpenApi({
      email: "user@example.com",
      password: "12345678",
      passwordConfirmation: "12345678"
    }),
    422,
    /đăng ký/
  );

  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await expectAuthError(
    () => loginWithOpenApi("user@example.com", "12345678"),
    503,
    /Không thể kết nối/
  );

  const valid = await readApiResponse(
    new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } }),
    "Dữ liệu lỗi."
  );
  assert.equal(valid.ok, true);

  await assert.rejects(
    () => readApiResponse(new Response("<html>error</html>", { status: 502, headers: { "content-type": "text/html" } }), "Lỗi."),
    (error: unknown) => {
      assert.ok(error instanceof ApiResponseError);
      assert.equal(error.httpStatus, 502);
      assert.match(error.message, /Máy chủ/);
      return true;
    }
  );

  assert.match(friendlyRequestError(new TypeError("Failed to fetch"), "Lỗi."), /kiểm tra mạng/);
  console.log("Auth error tests passed: 5");
} finally {
  globalThis.fetch = originalFetch;
}
}

void main();
