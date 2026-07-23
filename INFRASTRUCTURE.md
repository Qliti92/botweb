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

## AI intent fallback

Set `INTENT_AI_ENDPOINT` and `INTENT_AI_TOKEN`. The endpoint receives redacted text and an allowlist, and must return JSON with `intent`, `confidence`, and optional `parameters`. Results below `0.78` are ignored. Destructive and financial intents are not present in this fallback allowlist.
