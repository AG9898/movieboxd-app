# Auth
Last updated: 2026-01-18

## Goals
- Introduce multi-user authentication and profiles using Better Auth.
- Replace admin-only write gating with per-user sessions and ownership.
- Keep public browsing optional while protecting write routes.
- Preserve existing data model where possible; add user ownership fields.

## Non-goals
- Social graph, followers, comments, or messaging.
- Enterprise SSO or multi-tenant orgs.
- Client-side direct DB access.

## Provider strategy
- Start with email + password.
- Add OAuth providers later (Google, Apple, etc.) once the core flows are stable.
- Keep provider wiring isolated to Better Auth configuration.

## Session model
- HttpOnly cookies set by Better Auth.
- Server components and route handlers read the session on the server.
- Avoid client-side session reads for sensitive logic; use server helpers.

## Authorization rules
- Create operations always set `userId = session.user.id`.
- Read operations are scoped to `userId = session.user.id`.
- Update/delete operations require ownership (403 when mismatched).
- Never accept userId from the client.

## Route protection strategy (Next 16)
- Client pages redirect to `/sign-in` when no session is present.
- Route handlers verify session and ownership before any write.
- Do not rely on deprecated middleware patterns; keep auth checks server-side.

## Data model overview
- Better Auth core tables (users, accounts, sessions, verification tokens).
- App-level UserProfile table:
  - userId (FK to auth user)
  - handle, displayName, avatarUrl, bio
  - createdAt, updatedAt
- Existing domain tables (reviews, lists, list items) will gain user ownership fields.
  - Legacy rows are assigned to a system user during migration.

## Environment variables
Local (example names; finalize during implementation):
- DATABASE_URL
- BETTER_AUTH_SECRET (generate a strong random value; do not commit)
- BETTER_AUTH_URL
- EMAIL_FROM
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS

Vercel:
- Same as local, plus TMDB/Supabase secrets already required.

## Local testing checklist
- Run Prisma migrations and generate client.
- Sign up with email/password and confirm session cookie.
- Verify protected routes require auth.
- Create a review/list and confirm ownership.
- Sign out and verify protected routes are blocked.
