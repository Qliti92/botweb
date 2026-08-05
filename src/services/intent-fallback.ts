import { z } from "zod";

const allowed = ["BALANCE", "ORDERS", "WITHDRAWALS", "NOTIFICATIONS", "TASKS", "REFERRALS"] as const;
const responseSchema = z.object({
  intent: z.enum(allowed),
  confidence: z.number().min(0).max(1),
  parameters: z.object({
    platform: z.enum(["shopee", "tiktok"]).nullable().optional(),
    status: z.enum(["approved", "pending"]).nullable().optional()
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

export function redactIntentText(content: string) {
  return content
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL ĐÃ ẨN]")
    .replace(/\+?\d[\d\s.-]{7,}\d/g, "[SỐ ĐÃ ẨN]")
    .replace(/\b(?=[A-Z0-9_-]{8,}\b)(?=[A-Z0-9_-]*\d)[A-Z0-9_-]+\b/gi, "[MÃ ĐÃ ẨN]")
    .slice(0, 500);
}

function responseText(value: unknown) {
  if (!value || typeof value !== "object" || !("output" in value) || !Array.isArray(value.output)) return null;
  for (const item of value.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "type" in content && content.type === "output_text" && "text" in content && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

async function classifyWithOpenAI(text: string, signal: AbortSignal) {
  if (process.env.AI_INTENT_ENABLED !== "true" || !process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_INTENT_MODEL || "gpt-5.6-luna",
      store: false,
      reasoning: { effort: "none" },
      max_output_tokens: 200,
      input: [
        {
          role: "developer",
          content: "Bạn là bộ phân loại ý định cho Qbot. Chỉ chọn một intent trong danh sách được cung cấp. Không trả lời người dùng, không suy đoán dữ liệu cá nhân. Trả về JSON duy nhất gồm intent, confidence từ 0 đến 1 và parameters tùy chọn."
        },
        {
          role: "user",
          content: JSON.stringify({ text, allowedIntents: allowed })
        }
      ],
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "qbot_intent",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              intent: { type: "string", enum: allowed },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  platform: { type: ["string", "null"], enum: ["shopee", "tiktok", null] },
                  status: { type: ["string", "null"], enum: ["approved", "pending", null] }
                },
                required: ["platform", "status"]
              }
            },
            required: ["intent", "confidence", "parameters"]
          }
        }
      }
    }),
    signal
  });
  if (!response.ok) {
    console.warn(`[AI intent] OpenAI trả về HTTP ${response.status}; chatbot tiếp tục dùng bộ xử lý cũ.`);
    return null;
  }
  const textOutput = responseText(await response.json());
  if (!textOutput) return null;
  return JSON.parse(textOutput) as unknown;
}

export async function classifyIntentFallback(content: string) {
  const endpoint = process.env.INTENT_AI_ENDPOINT;
  const openAIEnabled = process.env.AI_INTENT_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
  if (!endpoint && !openAIEnabled) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const redactedText = redactIntentText(content);
    const raw = openAIEnabled
      ? await classifyWithOpenAI(redactedText, controller.signal)
      : await fetch(endpoint!, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(process.env.INTENT_AI_TOKEN ? { authorization: `Bearer ${process.env.INTENT_AI_TOKEN}` } : {})
          },
          body: JSON.stringify({
            text: redactedText,
            allowedIntents: allowed,
            instruction: "Chỉ phân loại ý định. Không trả lời người dùng và không đề xuất hành động ngoài danh sách."
          }),
          signal: controller.signal
        }).then(async (response) => response.ok ? response.json() : null);
    const parsed = responseSchema.safeParse(raw);
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
