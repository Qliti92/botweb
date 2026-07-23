const baseUrl = process.env.REDIS_REST_URL;
const token = process.env.REDIS_REST_TOKEN;

async function command(parts: Array<string | number>) {
  if (!baseUrl || !token) return null;
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(parts),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Redis error ${response.status}`);
  return (await response.json()) as { result?: unknown };
}

export async function redisGet(key: string) {
  const response = await command(["GET", key]);
  return typeof response?.result === "string" ? response.result : null;
}

export async function redisSet(key: string, value: string, ttlSeconds = 300) {
  await command(["SET", key, value, "EX", ttlSeconds]);
}

export async function redisPing() {
  if (!baseUrl || !token) return { enabled: false, ok: true };
  try {
    const response = await command(["PING"]);
    return { enabled: true, ok: response?.result === "PONG" };
  } catch {
    return { enabled: true, ok: false };
  }
}
