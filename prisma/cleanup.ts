import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  const apiLogDays = Number(process.env.API_LOG_RETENTION_DAYS ?? 30);
  const closedSessionDays = Number(process.env.CHAT_SESSION_RETENTION_DAYS ?? 90);

  const [apiLogs, chatSessions] = await Promise.all([
    prisma.apiLog.deleteMany({ where: { createdAt: { lt: daysAgo(apiLogDays) } } }),
    prisma.chatSession.deleteMany({
      where: {
        status: "CLOSED",
        updatedAt: { lt: daysAgo(closedSessionDays) }
      }
    })
  ]);

  console.log(`Deleted ${apiLogs.count} API logs and ${chatSessions.count} closed chat sessions.`);
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
