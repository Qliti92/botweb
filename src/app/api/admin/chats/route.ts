import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const sessions = await prisma.chatSession.findMany({
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 80 }
    },
    orderBy: { updatedAt: "desc" },
    take: 50
  });
  return NextResponse.json({
    sessions: sessions.map((session) => {
      const state = readState(session.state);
      return {
        ...session,
        user: state.account
          ? {
              phone: state.account.phone ?? "",
              email: state.account.email ?? "",
              userId: state.account.id ?? state.account.accountKey
            }
          : null
      };
    })
  });
}

function readState(raw: string) {
  try {
    return JSON.parse(raw || "{}") as {
      account?: { phone?: string; email?: string; id?: string; accountKey?: string };
    };
  } catch {
    return {};
  }
}
