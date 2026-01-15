# Current State
Last updated: 2026-01-14

## Architecture snapshot
- Stack
  - Next.js 16.1.1 (App Router)
  - React 19.2.3
  - Prisma 6.19.1 with Postgres
  - Tailwind CSS 4
  - Zod 4.3.5
- External APIs
  - TMDB (primary catalog)
  - TVMaze (fallback for TV search)
- Data store
  - Supabase Postgres planned; Prisma schema + initial migration in `prisma/`
- Reference docs: `./ARCHITECTURE.md`, `./API.md`, `./DB.md`
- Next steps: `./to_do.md`

## Implemented API routes
- `GET /api/catalog/search` - Search TMDB, fallback to TVMaze for TV results.
- `POST /api/catalog/hydrate` - Admin-only; upsert a title into Prisma.
- `GET /api/titles` - Query local titles by substring.
- `GET /api/titles/{tmdbId}` - Fetch a hydrated title by TMDB ID and media type.
- `GET /api/health/catalog` - Catalog API health check.
- `GET /api/health/db` - DB connectivity check.
- `GET /api/health/db-stats` - Counts for titles/diary/reviews/lists.
- `GET /api/diary` - List recent diary entries (supports `month` + `year` filters).
- `POST /api/diary/log` - Create a diary entry (admin-only).
- `POST /api/reviews` - Create a review with tags (admin-only).
- `GET /api/lists` - List all lists.
- `POST /api/lists` - Create a list (admin-only).
- `PUT /api/lists/{listId}` - Update a list (admin-only).
- `GET /api/lists/{listId}` - Fetch list metadata by ID.
- `DELETE /api/lists/{listId}` - Delete a list and its items (admin-only).
- `POST /api/lists/{listId}/items` - Add an item to a list (admin-only).
- `GET /api/lists/{listId}/items` - Fetch list items.
- `PUT /api/lists/{listId}/items` - Reorder items or update item notes (admin-only).
- `DELETE /api/lists/{listId}/items` - Remove a list item (admin-only).

## Implemented pages/components
- `src/app/page.tsx` is a custom landing page with working navigation links.
- `src/app/track/page.tsx` implements Track Films and is wired to catalog + diary APIs.
- `src/app/review/[tmdbId]/page.tsx` implements Rate & Review and is wired to catalog + review APIs.
- `src/app/lists/[listId]/edit/page.tsx` implements Curate Lists and is wired to list APIs.

## Known blockers / risks
- Admin auth is header-based only; no unlock flow or middleware for pages.
- Review page only shows title details if the title is hydrated.
- Database is expected but env validation does not enforce `DATABASE_URL`.
- No tests configured beyond linting.

## Next 5 tasks (ordered)
1) Add an admin unlock flow or middleware protection for write pages/actions.
2) Auto-hydrate titles on `/review/[tmdbId]` if missing (or add a prompt).
3) Add list item note validation + optimistic error rollback for list actions.
4) Implement lists index page and list creation flow.
5) Add basic tests or smoke checks for API routes.
