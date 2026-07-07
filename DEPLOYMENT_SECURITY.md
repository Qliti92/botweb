# Deployment Security Checklist

## Required production environment variables

Use strong, unique values for each deployment:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"
NEXT_PUBLIC_APP_URL="https://your-domain.vn"
JWT_SECRET="64+ random characters"
ENCRYPTION_SECRET="64+ random characters, different from JWT_SECRET"
ADMIN_EMAIL="admin"
ADMIN_PASSWORD="strong-password"
SHOPEE_API_KEY="your-api-key"
API_LOG_RETENTION_DAYS="30"
CHAT_SESSION_RETENTION_DAYS="90"
```

Never commit `.env`.

## Database

SQLite is fine for local testing. For production, use PostgreSQL or MySQL.

If switching to PostgreSQL, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

## Cleanup job

Run this daily on the server:

```bash
npm run db:cleanup
```

Example cron:

```cron
15 2 * * * cd /path/to/Webchat && npm run db:cleanup >> cleanup.log 2>&1
```

## Rate limiting

The current rate limiter is in-memory. It works for one Node.js process.
For multi-server production, replace `src/lib/rate-limit.ts` with Redis or Upstash Redis.

## Reverse proxy

Use HTTPS, Nginx, and proxy to `127.0.0.1:3000`.
Do not expose Node.js directly to the internet.
