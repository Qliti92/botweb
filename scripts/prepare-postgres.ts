import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const source = resolve("prisma/schema.prisma");
  const target = resolve("prisma/schema.postgresql.prisma");
  const schema = await readFile(source, "utf8");
  await writeFile(target, schema.replace('provider = "sqlite"', 'provider = "postgresql"'), "utf8");
  console.log(`Created ${target}. Set DATABASE_URL to PostgreSQL, then run prisma migrate deploy --schema prisma/schema.postgresql.prisma.`);
}

main();
