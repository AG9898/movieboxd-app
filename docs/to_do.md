# To Do
Last updated: 2026-01-18

## Priority list (next 10)
1) Profiles: design UserProfile model + profile edit UI plan.
2) Optional: OAuth providers (Google/Apple) via Better Auth.
3) Optional: public profile pages with privacy controls.
4) Pre-deploy: manual QA pass for Reviews, Lists, To Watch, Review detail.
5) Lint cleanup: resolve remaining lint errors/warnings.
6) Apply typography tokens across pages (headings, body, and secondary text).
7) Review entry flow: confirm dropdown alignment and close behavior after selection.
8) Add automated smoke tests for critical endpoints (run in CI or on deploy).
9) Add error monitoring/alerts (Sentry or Vercel monitoring).
10) Performance pass: catalog search debounce + list page render timings.

## Completed
- Auth migration phase 1: Better Auth setup, Prisma schema draft, env plan.
- Auth migration phase 2: session helpers + route protection strategy.
- Auth migration phase 3: user ownership fields + backfill plan.
- Auth migration phase 4: per-user isolation and removal of admin passphrase gating.
- Pre-deploy: set required Vercel env vars (DATABASE_URL, TMDB keys, Supabase vars).
- Pre-deploy: verify auth protection for write routes.
- Pre-deploy: confirm Supabase RLS and role permissions for public browsing.
- Pre-deploy: run prisma migrations on production (`prisma migrate deploy`) and verify schema.
- Pre-deploy: verify security headers + rate limiting in production.
- Pre-deploy: smoke-test health + core API endpoints (db, catalog, reviews, lists).

## QA notes (from testing)
- Review entry: search input can overflow and the dropdown persists after selection.
