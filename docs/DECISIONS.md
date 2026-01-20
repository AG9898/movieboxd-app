# Decisions (ADR-lite)
Last updated: 2026-01-17

## Decision 1
- Date: 2026-01-14
- Decision: Use Next.js App Router for the web app.
- Context: The repo is scaffolded with Next.js App Router and route handlers.
- Consequences: Pages and APIs live under `src/app`, with server components by default.

## Decision 2
- Date: 2026-01-14
- Decision: Use Prisma v6 with the library engine.
- Context: Prisma client is configured with `engineType = "library"` and used in `src/lib/prisma.ts`.
- Consequences: Prisma runs in Node.js runtime; route handlers set `runtime = "nodejs"` when needed.

## Decision 3
- Date: 2026-01-14
- Decision: Use TMDB as the primary catalog source with TVMaze fallback for TV.
- Context: `src/lib/catalog.ts` searches TMDB first and falls back to TVMaze for TV results.
- Consequences: Catalog search can return `source: "tmdb" | "tvmaze"` and hydration supports both.

## Decision 4
- Date: 2026-01-14
- Decision: Legacy admin-only write gating (deprecated).
- Context: Early deployments relied on a single-owner passphrase gate.
- Consequences: Superseded by per-user sessions and ownership enforcement.

## Decision 5
- Date: 2026-01-14
- Decision: Use standardized JSON API responses.
- Context: API routes return `{ ok: true, data }` or `{ ok: false, error }`.
- Consequences: Clients can rely on a consistent success/error envelope.

## Decision 6
- Date: 2026-01-17
- Decision: Consolidate Track + Reviews into a single Reviews dashboard.
- Context: Track films and reviews overlap in purpose and user flow.
- Consequences: The Track page is renamed to Reviews, the Reviews list page is removed, and recent reviews link to a review detail view.

## Decision 7
- Date: 2026-01-17
- Decision: Reviews dashboard creates reviews directly.
- Context: Recent activity should reflect review entries and feed the review detail flow.
- Consequences: Logging from the dashboard uses `POST /api/reviews`; recent items read from `GET /api/reviews`.

## Decision 8
- Date: 2026-01-18
- Decision: Move from admin unlock/no-accounts to Better Auth user accounts.
- Context: The current security model assumes a single admin and public read-only browsing.
- Consequences: Write operations require a signed-in user session and data becomes user-owned.

## Decision 9
- Date: 2026-01-18
- Decision: Remove legacy admin passphrase gating and enforce per-user ownership.
- Context: Multi-user auth requires write operations and reads to be scoped to the signed-in user.
- Consequences: All review/list/list item access is filtered by userId; signed-out users cannot write.
- Migration notes: Existing reviews and lists are assigned to a system user (`00000000-0000-0000-0000-000000000000`).
