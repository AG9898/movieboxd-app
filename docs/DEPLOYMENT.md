# Deployment
Last updated: 2026-01-18

## Vercel env var checklist (auth + DB)
- DATABASE_URL
- BETTER_AUTH_SECRET (generate a strong random value; do not commit)
- BETTER_AUTH_URL
- EMAIL_FROM
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- TMDB_API_KEY or TMDB_BEARER_TOKEN
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Prisma migration workflow (production)
- Create migrations locally and commit them.
- Deploy:
  - `npx prisma migrate deploy`
  - `npx prisma generate`
- Verify with `GET /api/health/db` and a basic auth flow.
 - Vercel build uses `vercel-build` to run `prisma migrate deploy` before `next build`.

## Verify auth in production
- Confirm `/api/auth/*` endpoints respond (login, signup, session).
- Load a protected page and verify redirect to auth when signed out.
- Create a review/list and confirm it is tied to the signed-in user.

## Rollback plan
- Revert to the previous Vercel deployment.
- Restore the DB from the last backup if migrations broke compatibility.
- Disable new auth routes via a hotfix if sessions are failing.
