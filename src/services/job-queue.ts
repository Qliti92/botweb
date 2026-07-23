import { prisma } from "@/lib/prisma";

export async function enqueueJob(type: string, payload: Record<string, unknown>, options?: { runAt?: Date; maxAttempts?: number }) {
  return prisma.jobQueue.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      runAt: options?.runAt ?? new Date(),
      maxAttempts: options?.maxAttempts ?? 3
    }
  });
}

export async function processNextJob() {
  const job = await prisma.jobQueue.findFirst({ where: { status: "PENDING", runAt: { lte: new Date() } }, orderBy: { runAt: "asc" } });
  if (!job) return null;
  const locked = await prisma.jobQueue.updateMany({
    where: { id: job.id, status: "PENDING" },
    data: { status: "PROCESSING", lockedAt: new Date(), attempts: { increment: 1 } }
  });
  if (!locked.count) return null;
  try {
    const payload = JSON.parse(job.payload) as Record<string, unknown>;
    if (job.type === "DELIVER_NOTIFICATION") {
      await prisma.proactiveNotification.update({
        where: { id: String(payload.notificationId) },
        data: { deliveredAt: new Date() }
      });
    } else if (job.type === "CLEANUP") {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await prisma.apiLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    } else {
      throw new Error(`Unsupported job type: ${job.type}`);
    }
    return prisma.jobQueue.update({ where: { id: job.id }, data: { status: "COMPLETED", lockedAt: null, lastError: null } });
  } catch (error) {
    const attempts = job.attempts + 1;
    const failed = attempts >= job.maxAttempts;
    return prisma.jobQueue.update({
      where: { id: job.id },
      data: {
        status: failed ? "FAILED" : "PENDING",
        lockedAt: null,
        runAt: new Date(Date.now() + Math.min(60_000, 2 ** attempts * 1000)),
        lastError: error instanceof Error ? error.message.slice(0, 1000) : "Unknown error"
      }
    });
  }
}
