import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      state TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS api_configs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'POST',
      headers TEXT NOT NULL DEFAULT '{}',
      body_sample TEXT NOT NULL DEFAULT '{}',
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS conversation_flows (
      id TEXT PRIMARY KEY NOT NULL,
      flow_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      trigger_keyword TEXT,
      bot_message TEXT NOT NULL,
      expected_input_type TEXT,
      next_flow_key TEXT,
      action_type TEXT,
      api_id TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL,
      CONSTRAINT conversation_flows_api_id_fkey FOREIGN KEY (api_id) REFERENCES api_configs (id) ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY NOT NULL,
      api_id TEXT,
      session_id TEXT,
      request TEXT NOT NULL,
      response TEXT,
      status_code INTEGER,
      error TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT api_logs_api_id_fkey FOREIGN KEY (api_id) REFERENCES api_configs (id) ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS short_links (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      original_url TEXT NOT NULL,
      title TEXT,
      click_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
