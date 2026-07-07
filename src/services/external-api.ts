import { ApiConfig } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseJson(value: string) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

export async function callConfiguredApi(api: ApiConfig, payload: Record<string, unknown>, sessionId?: string) {
  const requestSnapshot = JSON.stringify(payload);

  if (api.endpoint.startsWith("mock://convert-link")) {
    const input = String(payload.url ?? payload.input ?? "");
    const convertedUrl = `https://converted.example.com/?target=${encodeURIComponent(input)}`;
    await prisma.apiLog.create({
      data: { apiId: api.id, sessionId, request: requestSnapshot, response: JSON.stringify({ convertedUrl }), statusCode: 200 }
    });
    return { ok: true, data: { convertedUrl } };
  }

  if (api.endpoint.startsWith("mock://check-order")) {
    const orderCode = String(payload.input ?? "ORDER");
    const data = {
      orderCode,
      status: "đang giao, dự kiến hoàn tất trong 24 giờ"
    };
    await prisma.apiLog.create({
      data: { apiId: api.id, sessionId, request: requestSnapshot, response: JSON.stringify(data), statusCode: 200 }
    });
    return { ok: true, data };
  }

  if (api.endpoint.startsWith("mock://balance")) {
    const data = {
      balance: "1.250.000",
      currency: "VND"
    };
    await prisma.apiLog.create({
      data: { apiId: api.id, sessionId, request: requestSnapshot, response: JSON.stringify(data), statusCode: 200 }
    });
    return { ok: true, data };
  }

  if (api.endpoint.startsWith("mock://account-info")) {
    const data = {
      userId: payload.userId,
      email: payload.email,
      phone: payload.phone
    };
    await prisma.apiLog.create({
      data: { apiId: api.id, sessionId, request: requestSnapshot, response: JSON.stringify(data), statusCode: 200 }
    });
    return { ok: true, data };
  }

  try {
    const headers = parseJson(api.headers);
    const isShopeeProductApi = api.endpoint.includes("apishopee.cmsnt.co/api/v1/shopee/product");
    const requestPayload = isShopeeProductApi
      ? { product_link: String(payload.input ?? payload.product_link ?? "") }
      : payload;
    const bearerToken = typeof payload.accessToken === "string" ? payload.accessToken : "";
    const tokenType = typeof payload.tokenType === "string" ? payload.tokenType : "Bearer";
    const authHeaders = {
      ...(isShopeeProductApi && process.env.SHOPEE_API_KEY ? { "X-API-KEY": process.env.SHOPEE_API_KEY } : {}),
      ...(bearerToken ? { Authorization: `${tokenType} ${bearerToken}` } : {})
    };
    const init: RequestInit = {
      method: api.method,
      headers: { "content-type": "application/json", ...headers, ...authHeaders }
    };

    if (api.method === "POST") {
      init.body = JSON.stringify(requestPayload);
    }

    const url = api.method === "GET" ? `${api.endpoint}?${new URLSearchParams(requestPayload as Record<string, string>)}` : api.endpoint;
    const response = await fetch(url, init);
    const text = await response.text();

    await prisma.apiLog.create({
      data: { apiId: api.id, sessionId, request: requestSnapshot, response: text, statusCode: response.status }
    });

    if (!response.ok) return { ok: false, error: text };

    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      return { ok: true, data: { raw: text } };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown API error";
    await prisma.apiLog.create({
      data: { apiId: api.id, sessionId, request: requestSnapshot, error: message }
    });
    return { ok: false, error: message };
  }
}
