# Deployment Security Checklist

## Required production environment variables

Use strong, unique values for each deployment:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"
NEXT_PUBLIC_APP_URL="https://qbot.vn"
ALLOWED_ORIGINS="https://qbot.vn,https://www.qbot.vn,https://tranquan.vn,https://www.tranquan.vn"
UPLOAD_STORAGE_DIR="/var/lib/botweb/uploads"
JWT_SECRET="64+ random characters"
ENCRYPTION_SECRET="64+ random characters, different from JWT_SECRET"
ADMIN_EMAIL="admin"
ADMIN_PASSWORD="strong-password"
SHOPEE_API_KEY="your-api-key"
API_LOG_RETENTION_DAYS="30"
CHAT_SESSION_RETENTION_DAYS="90"
```

For a single-server SQLite deployment, keep the database outside the Git
working tree so a release update cannot replace it:

```env
DATABASE_URL="file:/var/lib/botweb/data/botweb.db"
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
Forward `Host`, `X-Forwarded-Host` and `X-Forwarded-Proto` so same-origin
validation can reconstruct the public URL. The production server also needs:

```nginx
server_name qbot.vn www.qbot.vn tranquan.vn www.tranquan.vn;
client_max_body_size 10M;

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Use `qbot.vn` as the canonical domain. Redirect legacy aliases to it when
possible to avoid duplicate SEO URLs.
