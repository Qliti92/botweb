import { prisma } from "../src/lib/prisma";
import { processNextJob } from "../src/services/job-queue";

async function main() {
  let processed = 0;
  while (processed < 100) {
    const job = await processNextJob();
    if (!job) break;
    processed += 1;
  }
  console.log(`Processed ${processed} jobs.`);
}

main().finally(() => prisma.$disconnect());
