# Decisions (ADR-lite)
Last updated: 2026-01-14

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
- Decision: Admin-only write operations via `PUBLIC_READONLY` + `x-admin-passphrase`.
- Context: `src/lib/admin.ts` checks a header when `PUBLIC_READONLY=true`.
- Consequences: Write endpoints require the header unless `PUBLIC_READONLY=false`.

## Decision 5
- Date: 2026-01-14
- Decision: Use standardized JSON API responses.
- Context: API routes return `{ ok: true, data }` or `{ ok: false, error }`.
- Consequences: Clients can rely on a consistent success/error envelope.
