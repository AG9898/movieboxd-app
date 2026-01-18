# To Do
Last updated: 2026-01-17

## Priority list (next 10)
1) Pre-deploy: set required Vercel env vars (DATABASE_URL, TMDB keys, ADMIN_PASSPHRASE, PUBLIC_READONLY, Supabase vars).
2) Pre-deploy: verify write protection (admin unlock + middleware guards) and PUBLIC_READONLY behavior.
3) Pre-deploy: confirm Supabase RLS and role permissions for public browsing.
4) Pre-deploy: run prisma migrations on production (`prisma migrate deploy`) and verify schema.
5) Pre-deploy: verify security headers + rate limiting in production.
6) Pre-deploy: smoke-test health + core API endpoints (db, catalog, reviews, lists).
7) Pre-deploy: manual QA pass for Reviews, Lists, To Watch, Review detail.
8) Lint cleanup: resolve remaining lint errors/warnings.
9) Apply typography tokens across pages (headings, body, and secondary text).
10) Review entry flow: confirm dropdown alignment and close behavior after selection.

## QA notes (from testing)
- Review entry: search input can overflow and the dropdown persists after selection.
