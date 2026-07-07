const openApiBaseUrl = "https://hoantienmuahang.vn/api/v1/openapi";

type ApiOptions = {
  token: string;
  tokenType?: string;
  query?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function authHeaders(token: string, tokenType = "Bearer") {
  return {
    "content-type": "application/json",
    Authorization: `${tokenType} ${token}`
  };
}

function buildUrl(path: string, query?: ApiOptions["query"]) {
  const url = new URL(`${openApiBaseUrl}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function requestJson(method: "GET" | "POST", path: string, options: ApiOptions) {
  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: authHeaders(options.token, options.tokenType),
    body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined
  });
  const data = asRecord(await response.json().catch(() => ({})));

  if (!response.ok || data.success === false) {
    throw new Error(String(data.message ?? data.error ?? "Yêu cầu API thất bại."));
  }

  return asRecord(data.data ?? data);
}

export function getAccount(token: string, tokenType?: string) {
  return requestJson("GET", "/account", { token, tokenType });
}

export function updateProfile(token: string, tokenType: string | undefined, body: { name?: string; phone?: string }) {
  return requestJson("POST", "/account/profile", { token, tokenType, body });
}

export function changePassword(token: string, tokenType: string | undefined, body: { current_password: string; password: string; password_confirmation: string }) {
  return requestJson("POST", "/account/password", { token, tokenType, body });
}

export function deleteAccount(token: string, tokenType?: string) {
  return requestJson("POST", "/account/delete", { token, tokenType });
}

export function getWithdrawals(token: string, tokenType?: string, page = 1) {
  return requestJson("GET", "/withdrawals", { token, tokenType, query: { page, per_page: 5 } });
}

export function sendWithdrawalOtp(token: string, tokenType?: string) {
  return requestJson("POST", "/withdrawals/otp", { token, tokenType });
}

export function createWithdrawal(
  token: string,
  tokenType: string | undefined,
  body: {
    amount: number;
    payment_method: string;
    bank_name?: string;
    wallet_name?: string;
    account_number: string;
    account_name: string;
    otp_code?: string;
  }
) {
  return requestJson("POST", "/withdrawals", { token, tokenType, body });
}

export function getOrders(token: string, tokenType?: string, query?: { status?: string; platform?: string; search?: string; page?: number; per_page?: number }) {
  return requestJson("GET", "/orders", { token, tokenType, query: { per_page: 50, ...query } });
}

export function getNotifications(token: string, tokenType?: string, query?: { type?: string; filter?: string; page?: number; per_page?: number }) {
  return requestJson("GET", "/notifications", { token, tokenType, query: { per_page: 5, ...query } });
}

export async function getUnreadNotificationCount(token: string, tokenType?: string) {
  const data = await requestJson("GET", "/notifications/unread-count", { token, tokenType });
  return Number(data.count ?? data.unread_count ?? data.total ?? 0);
}

export function markNotificationRead(token: string, tokenType: string | undefined, id: string) {
  return requestJson("POST", `/notifications/${id}/read`, { token, tokenType });
}

export function markAllNotificationsRead(token: string, tokenType?: string) {
  return requestJson("POST", "/notifications/read-all", { token, tokenType });
}
