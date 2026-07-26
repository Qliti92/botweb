import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const batchSize = 500;

type RetentionSettings = {
  guestChatRetentionDays?: number;
  memberChatRetentionDays?: number;
  inactiveSessionRetentionDays?: number;
  supportTicketRetentionDays?: number;
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function safeDays(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function isMemberState(state: string) {
  try {
    const parsed = JSON.parse(state) as { account?: unknown };
    return Boolean(parsed.account);
  } catch {
    return false;
  }
}

async function deleteOldMessages(guestDays: number, memberDays: number) {
  let deleted = 0;
  let cursor: string | undefined;

  while (true) {
    const sessions = await prisma.chatSession.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, state: true }
    });
    if (!sessions.length) break;
    cursor = sessions.at(-1)?.id;

    const guestIds = sessions.filter((session) => !isMemberState(session.state)).map((session) => session.id);
    const memberIds = sessions.filter((session) => isMemberState(session.state)).map((session) => session.id);
    const [guestResult, memberResult] = await Promise.all([
      guestIds.length
        ? prisma.chatMessage.deleteMany({ where: { sessionId: { in: guestIds }, createdAt: { lt: daysAgo(guestDays) } } })
        : Promise.resolve({ count: 0 }),
      memberIds.length
        ? prisma.chatMessage.deleteMany({ where: { sessionId: { in: memberIds }, createdAt: { lt: daysAgo(memberDays) } } })
        : Promise.resolve({ count: 0 })
    ]);
    deleted += guestResult.count + memberResult.count;
    if (sessions.length < batchSize) break;
  }

  return deleted;
}

async function deleteInactiveSessions(retentionDays: number) {
  let deleted = 0;
  const cutoff = daysAgo(retentionDays);

  while (true) {
    const sessions = await prisma.chatSession.findMany({
      take: batchSize,
      where: {
        updatedAt: { lt: cutoff },
        messages: { none: { createdAt: { gte: cutoff } } }
      },
      select: { id: true }
    });
    if (!sessions.length) break;
    const result = await prisma.chatSession.deleteMany({ where: { id: { in: sessions.map((session) => session.id) } } });
    deleted += result.count;
  }

  return deleted;
}

async function deleteClosedTickets(retentionDays: number) {
  let deleted = 0;
  const cutoff = daysAgo(retentionDays);

  while (true) {
    const tickets = await prisma.supportTicket.findMany({
      take: batchSize,
      where: { status: { in: ["RESOLVED", "CLOSED"] }, updatedAt: { lt: cutoff } },
      select: { id: true }
    });
    if (!tickets.length) break;
    const result = await prisma.supportTicket.deleteMany({ where: { id: { in: tickets.map((ticket) => ticket.id) } } });
    deleted += result.count;
  }

  return deleted;
}

async function main() {
  const stored = await prisma.siteSetting.findUnique({ where: { id: "site" }, select: { data: true } });
  let settings: RetentionSettings = {};
  try {
    settings = JSON.parse(stored?.data ?? "{}") as RetentionSettings;
  } catch {
    settings = {};
  }

  const apiLogDays = safeDays(process.env.API_LOG_RETENTION_DAYS, 30, 1, 365);
  const guestDays = safeDays(settings.guestChatRetentionDays, 7, 1, 365);
  const memberDays = safeDays(settings.memberChatRetentionDays, 30, 1, 730);
  const inactiveDays = safeDays(settings.inactiveSessionRetentionDays ?? process.env.CHAT_SESSION_RETENTION_DAYS, 90, 7, 730);
  const ticketDays = safeDays(settings.supportTicketRetentionDays, 180, 30, 1825);

  const apiLogs = await prisma.apiLog.deleteMany({ where: { createdAt: { lt: daysAgo(apiLogDays) } } });
  const messages = await deleteOldMessages(guestDays, memberDays);
  const sessions = await deleteInactiveSessions(inactiveDays);
  const tickets = await deleteClosedTickets(ticketDays);

  console.log(JSON.stringify({
    retentionDays: { apiLogs: apiLogDays, guestMessages: guestDays, memberMessages: memberDays, inactiveSessions: inactiveDays, closedTickets: ticketDays },
    deleted: { apiLogs: apiLogs.count, chatMessages: messages, chatSessions: sessions, supportTickets: tickets }
  }));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
