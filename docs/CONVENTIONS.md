# Conventions
Last updated: 2026-01-14

## Repo layout
- `src/app` for pages and API route handlers (App Router).
- `src/lib` for server-only utilities (env, Prisma, catalog clients).
- `prisma/` for schema and migrations.
- `docs/` for project docs; use relative links between docs.

## Tailwind usage
- Prefer Tailwind utility classes over custom CSS.
- Limit `globals.css` to base styles and resets.

## Server vs client components
- Default to server components.
- Add `"use client"` only for interactive components.
- Keep server-only logic in `src/lib` with `server-only` imports.

## API route patterns
- Validate input with Zod.
- Return `{ ok: true, data }` or `{ ok: false, error }`.
- Use `runtime = "nodejs"` for routes that rely on Prisma.
- Protect mutating routes with session + ownership checks.

## Auth conventions
- Place auth helpers in `src/lib/auth` (session, guards, user lookup).
- Place auth route handlers in `src/app/api/auth`.
- Place auth UI in `src/components/auth`.
- Read sessions on the server; avoid client-side session access for authorization.
- Use proxy-based route protection for pages in Next 16.
- Any auth or DB change must update `docs/AUTH.md` and `docs/CHANGELOG.md`.

## Prisma usage
- Use the singleton client from `src/lib/prisma.ts` only.
- Expect Postgres; keep `engineType = "library"`.

## Commit messages
- Not specified yet. Keep messages short, present-tense, and scoped to one change.

## Changelog workflow
- Every time code is modified, add an entry under `docs/CHANGELOG.md` > [Unreleased].
- Categorize each entry (Added/Changed/Fixed/Removed/Security) and mention the impacted area (API/DB/UI/etc).
- When a stable milestone is reached, cut a dated release section and reset [Unreleased].
- Example: `- Fixed (API): handle empty catalog search queries with a 400 response.`

## When in doubt
- Follow patterns in `src/lib` and existing API routes.
- Update `docs/CURRENT_STATE.md` if behavior changes.
