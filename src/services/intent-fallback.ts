import { z } from "zod";

const allowed = ["BALANCE", "ORDERS", "WITHDRAWALS", "NOTIFICATIONS", "TASKS", "REFERRALS"] as const;
const responseSchema = z.object({
  intent: z.enum(allowed),
  confidence: z.number().min(0).max(1),
  parameters: z.object({
    platform: z.enum(["shopee", "tiktok"]).optional(),
    status: z.enum(["approved", "pending"]).optional()
  }).optional()
});

const commands: Record<(typeof allowed)[number], string> = {
  BALANCE: "/taikhoan",
  ORDERS: "/donhang",
  WITHDRAWALS: "/lichsurut",
  NOTIFICATIONS: "/thongbao",
  TASKS: "/nhiemvu",
  REFERRALS: "/gioithieu"
};

export async function classifyIntentFallback(content: string) {
  const endpoint = process.env.INTENT_AI_ENDPOINT;
  if (!endpoint) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.INTENT_AI_TOKEN ? { authorization: `Bearer ${process.env.INTENT_AI_TOKEN}` } : {})
      },
      body: JSON.stringify({
        text: content
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
          .replace(/\+?\d[\d\s.-]{7,}\d/g, "[SỐ ĐÃ ẨN]")
          .slice(0, 500),
        allowedIntents: allowed,
        instruction: "Chỉ phân loại ý định. Không trả lời người dùng và không đề xuất hành động ngoài danh sách."
      }),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.confidence < 0.78) return null;
    const params = parsed.data.parameters;
    const suffix = parsed.data.intent === "ORDERS"
      ? `${params?.status ? ` status=${params.status}` : ""}${params?.platform ? ` platform=${params.platform}` : ""}`
      : "";
    return { ...parsed.data, command: `${commands[parsed.data.intent]}${suffix}` };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
