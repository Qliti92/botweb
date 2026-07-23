# Production infrastructure

## PostgreSQL

Run `npm run postgres:prepare`, set `DATABASE_URL` to PostgreSQL, then generate and deploy with:

```powershell
npx prisma generate --schema prisma/schema.postgresql.prisma
npx prisma migrate deploy --schema prisma/schema.postgresql.prisma
```

Import existing SQLite data only after taking a backup and validating row counts in a staging database.

## Redis

Set `REDIS_REST_URL` and `REDIS_REST_TOKEN`. Without them, Ry continues in local fallback mode.

## Job worker

Run `npm run jobs:work` from a scheduled worker. Jobs use database locking, exponential retry and a maximum-attempt limit.

## Scheduled Web Push

Generate a dedicated VAPID key pair once:

```powershell
npx web-push generate-vapid-keys --json
```

Set `NEXT_PUBLIC_WEB_PUSH_VAPID_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, and a strong `CRON_SECRET` in production. Keep the private key and cron secret outside Git. The public key is embedded into the browser build, so rebuild after changing it.

Initialize the new tables with `npm run db:init` for the SQLite deployment. Then call the protected scheduler once per minute:

```text
GET https://tranquan.vn/api/cron/push
Authorization: Bearer <CRON_SECRET>
```

The admin page contains a `Push theo lịch` tab for one-time or daily reminders. Invalid/expired browser subscriptions are removed automatically after push services return HTTP 404 or 410.

## AI intent fallback

Set `INTENT_AI_ENDPOINT` and `INTENT_AI_TOKEN`. The endpoint receives redacted text and an allowlist, and must return JSON with `intent`, `confidence`, and optional `parameters`. Results below `0.78` are ignored. Destructive and financial intents are not present in this fallback allowlist.
