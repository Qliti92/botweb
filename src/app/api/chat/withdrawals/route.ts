import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMatchingChatSession } from "@/lib/chat-session";
import { withdrawalFormSchema } from "@/lib/validators";
import { decryptSecret } from "@/lib/crypto";
import { createWithdrawal } from "@/services/openapi-member";
import { writeAuditLog } from "@/lib/audit";

function accountFromState(raw: string) {
  try {
    return (JSON.parse(raw) as { account?: { accountKey: string; token: string; tokenType: string } }).account;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const sessionId = await requireMatchingChatSession(request);
  const body = withdrawalFormSchema.parse(await request.json());
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId }, select: { state: true } });
  const account = accountFromState(session?.state ?? "{}");
  if (!account) return NextResponse.json({ error: "Bạn cần đăng nhập trước khi rút tiền." }, { status: 401 });
  const result = await createWithdrawal(decryptSecret(account.token), account.tokenType, {
    amount: body.amount,
    payment_method: "bank",
    bank_name: body.bankName,
    account_number: body.accountNumber,
    account_name: body.accountName
  });
  await writeAuditLog({ actorType: "USER", actorId: account.accountKey, action: "WITHDRAWAL_CREATE_FORM", targetType: "ChatSession", targetId: sessionId, metadata: { amount: body.amount, bankName: body.bankName } });
  return NextResponse.json({ result });
}
