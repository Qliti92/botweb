import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { decryptSecret } from "@/lib/crypto";
import { createPaymentAccount, getPaymentAccounts } from "@/services/openapi-member";

function accountFromState(raw: string) {
  try {
    return (JSON.parse(raw) as { account?: { token: string; tokenType: string } }).account;
  } catch {
    return undefined;
  }
}

async function authenticatedAccount(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  const account = accountFromState(session?.state ?? "{}");
  if (!account) throw new Error("Bạn cần đăng nhập để sử dụng sổ tài khoản.");
  return { token: decryptSecret(account.token), tokenType: account.tokenType };
}

const createSchema = z.object({
  paymentMethod: z.enum(["bank", "wallet"]),
  bankName: z.string().trim().min(2).max(100),
  accountNumber: z.string().trim().min(6).max(30),
  accountName: z.string().trim().min(2).max(120),
  isDefault: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const account = await authenticatedAccount(request);
    const data = await getPaymentAccounts(account.token, account.tokenType);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tải sổ tài khoản." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const account = await authenticatedAccount(request);
    const body = createSchema.parse(await request.json());
    const data = await createPaymentAccount(account.token, account.tokenType, {
      payment_method: body.paymentMethod,
      bank_name: body.bankName,
      account_number: body.accountNumber,
      account_name: body.accountName.toUpperCase(),
      is_default: body.isDefault
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu tài khoản." }, { status: 400 });
  }
}
