# To Do
Last updated: 2026-01-18

## Priority list (next 10)
1) Pre-deploy: manual QA pass for Reviews, Lists, To Watch, Review detail.
2) Lint cleanup: resolve remaining lint errors/warnings.
3) Apply typography tokens across pages (headings, body, and secondary text).
4) Review entry flow: confirm dropdown alignment and close behavior after selection.
5) Add automated smoke tests for critical endpoints (run in CI or on deploy).
6) Add error monitoring/alerts (Sentry or Vercel monitoring).
7) Enable database backups/PITR and document recovery steps.
8) Add basic analytics or audit logging for admin actions (optional).
9) Add production cron job for catalog cache refresh (optional).
10) Add CI typecheck/build step to block broken deploys.

## Completed
- Pre-deploy: set required Vercel env vars (DATABASE_URL, TMDB keys, ADMIN_PASSPHRASE, PUBLIC_READONLY, Supabase vars).
- Pre-deploy: verify write protection (admin unlock + proxy guards) and PUBLIC_READONLY behavior.
- Pre-deploy: confirm Supabase RLS and role permissions for public browsing.
- Pre-deploy: run prisma migrations on production (`prisma migrate deploy`) and verify schema.
- Pre-deploy: verify security headers + rate limiting in production.
- Pre-deploy: smoke-test health + core API endpoints (db, catalog, reviews, lists).

## QA notes (from testing)
- Review entry: search input can overflow and the dropdown persists after selection.
