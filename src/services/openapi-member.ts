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

export function getWithdrawals(token: string, tokenType?: string, page = 1, perPage = 5) {
  return requestJson("GET", "/withdrawals", { token, tokenType, query: { page, per_page: perPage } });
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
  return requestJson("GET", "/orders", { token, tokenType, query: { per_page: 100, ...query } });
}

export async function getAllOrders(token: string, tokenType?: string, query?: { status?: string; platform?: string; search?: string }) {
  const combined: Record<string, unknown>[] = [];
  let firstPage: Record<string, unknown> = {};

  for (let page = 1; page <= 50; page += 1) {
    const data = await getOrders(token, tokenType, { ...query, page, per_page: 100 });
    if (page === 1) firstPage = data;
    const rawItems = data.items ?? data.orders ?? data.data;
    const items = Array.isArray(rawItems) ? rawItems.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
    combined.push(...items);

    const pagination = asRecord(data.pagination ?? data.meta);
    const lastPage = Number(pagination.last_page ?? pagination.lastPage ?? data.last_page ?? data.lastPage);
    if ((Number.isFinite(lastPage) && page >= lastPage) || items.length < 100) break;
  }

  return { ...firstPage, items: combined };
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

export function getTasks(token: string, tokenType?: string) {
  return requestJson("GET", "/tasks", { token, tokenType });
}

export function syncTask(token: string, tokenType: string | undefined, id: string) {
  return requestJson("GET", `/tasks/${encodeURIComponent(id)}/sync`, { token, tokenType });
}

export function claimTask(token: string, tokenType: string | undefined, id: string) {
  return requestJson("POST", `/tasks/${encodeURIComponent(id)}/claim`, { token, tokenType });
}

export function getReferrals(token: string, tokenType?: string) {
  return requestJson("GET", "/referrals", { token, tokenType });
}

export function getBalanceLogs(token: string, tokenType?: string, page = 1) {
  return requestJson("GET", "/balance-logs", { token, tokenType, query: { page, per_page: 10 } });
}

export function getActivityLogs(token: string, tokenType?: string, page = 1) {
  return requestJson("GET", "/logs", { token, tokenType, query: { page, per_page: 10 } });
}

export function getSecurityStatus(token: string, tokenType?: string) {
  return requestJson("GET", "/security", { token, tokenType });
}

export function getSessions(token: string, tokenType?: string) {
  return requestJson("GET", "/sessions", { token, tokenType });
}

export function revokeSession(token: string, tokenType: string | undefined, id: string) {
  return requestJson("POST", `/sessions/${encodeURIComponent(id)}/revoke`, { token, tokenType });
}

export function revokeOtherSessions(token: string, tokenType?: string) {
  return requestJson("POST", "/sessions/revoke-others", { token, tokenType });
}

export function getDevices(token: string, tokenType?: string) {
  return requestJson("GET", "/devices", { token, tokenType });
}

export function registerDevice(
  token: string,
  tokenType: string | undefined,
  body: { token: string; platform: "web" | "android" | "ios"; device_name: string }
) {
  return requestJson("POST", "/devices/register", { token, tokenType, body });
}

export function unregisterDevice(token: string, tokenType: string | undefined, deviceToken: string) {
  return requestJson("POST", "/devices/unregister", { token, tokenType, body: { token: deviceToken } });
}
