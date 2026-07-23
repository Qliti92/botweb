import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { rateLimit } from "@/lib/rate-limit";
import { getOpenApiAccountForSession } from "@/services/conversation";
import { getDevices, registerDevice, unregisterDevice } from "@/services/openapi-member";

const deviceSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("register"),
    sessionId: z.string().min(1),
    token: z.string().min(20),
    platform: z.enum(["web", "android", "ios"]).default("web"),
    deviceName: z.string().trim().min(1).max(100)
  }),
  z.object({
    action: z.literal("unregister"),
    sessionId: z.string().min(1),
    token: z.string().min(20)
  })
]);

function limited(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  return rateLimit(`chat-devices:${ip}`, 30, 60_000);
}

export async function GET(request: NextRequest) {
  if (!limited(request).ok) return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });

  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "Thiếu sessionId." }, { status: 400 });
    await requireMatchingChatSession(request, sessionId);
    const account = await getOpenApiAccountForSession(sessionId);
    return NextResponse.json(await getDevices(account.token, account.tokenType));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tải thiết bị." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!limited(request).ok) return NextResponse.json({ error: "Bạn thao tác quá nhanh." }, { status: 429 });

  try {
    const body = deviceSchema.parse(await request.json());
    await requireMatchingChatSession(request, body.sessionId);
    const account = await getOpenApiAccountForSession(body.sessionId);
    const data =
      body.action === "register"
        ? await registerDevice(account.token, account.tokenType, {
            token: body.token,
            platform: body.platform,
            device_name: body.deviceName
          })
        : await unregisterDevice(account.token, account.tokenType, body.token);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật thiết bị." }, { status: 400 });
  }
}
