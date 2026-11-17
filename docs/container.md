# Standalone container handoff

- Internal port: `3000`; bind address: `0.0.0.0`.
- Liveness: `GET /health` (also `/api/health`), no authentication or database calls.
- Default `SHADOW_NOINDEX=1` adds `X-Robots-Tag` and disallows crawling in `robots.txt`. The deployment owner may set `0` after cutover approval.
- `vercel.json` and Next rewrites both expose the same health route.
- Vercel cron: `/api/cron/automation` every five minutes; standalone hosting needs the deployment owner's scheduler with `Authorization: Bearer <CRON_SECRET>`.

## Infisical key names

Supply existing values via the approved Infisical integration; never copy an environment file into the image.

Public build arguments (Next embeds these in client bundles): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BASE_DOMAIN`.
Also inject those keys at runtime for server code.

Runtime server keys by enabled feature:
- Supabase: `SUPABASE_SERVICE_ROLE_KEY`
- AI: `OPENROUTER_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Mail/search: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `HUNTER_API_KEY`
- Scheduled automation: `CRON_SECRET`
- Existing Vercel site-publishing integration: `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`

## CI

Use Ubuntu 24.04 and Node 22 (compatible with the locked Playwright).
Run dependency CVE checks, production build, unit tests and isolated standalone smoke tests.
The original authenticated E2E suite remains available through `npm run test:e2e` for a provisioned staging environment; it must not log into production from pull-request CI.
