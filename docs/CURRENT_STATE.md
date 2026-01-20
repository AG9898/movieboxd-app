# Current State
Last updated: 2026-01-18

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
  - Supabase Postgres active; Prisma schema + migrations applied in production
- Reference docs: `./ARCHITECTURE.md`, `./API.md`, `./DB.md`
- Next steps: `./to_do.md`

## Implemented API routes
- Auth and ownership: review/list/list item endpoints require a signed-in session and scope data to the current user.
- `GET /api/catalog/search` - Search TMDB, fallback to TVMaze for TV results.
- `POST /api/catalog/hydrate` - Admin-only; upsert a title into Prisma.
- `GET /api/titles` - Query local titles by substring.
- `GET /api/titles/{tmdbId}` - Fetch a hydrated title by TMDB ID and media type.
- `GET /api/health/catalog` - Catalog API health check.
- `GET /api/health/db` - DB connectivity check.
- `GET /api/health/db-stats` - Counts for titles/reviews/lists.
- `POST /api/reviews` - Create a review with tags (auth required).
- `GET /api/reviews` - List reviews with title metadata and tags.
- `GET /api/reviews/{reviewId}` - Fetch a single review with title metadata and tags.
- `GET /api/lists` - List all lists.
- `POST /api/lists` - Create a list (auth required).
- `PUT /api/lists/{listId}` - Update a list (auth required).
- `GET /api/lists/{listId}` - Fetch list metadata by ID.
- `DELETE /api/lists/{listId}` - Delete a list and its items (auth required).
- `POST /api/lists/{listId}/items` - Add an item to a list (auth required).
- `GET /api/lists/{listId}/items` - Fetch list items.
- `PUT /api/lists/{listId}/items` - Reorder items or update item notes (auth required).
- `DELETE /api/lists/{listId}/items` - Remove a list item (auth required).

## Implemented pages/components
- `src/app/page.tsx` is a custom landing page with working navigation links.
- `src/app/reviews/page.tsx` implements the Reviews dashboard, hydrates titles, creates reviews, and lists recent reviews.
- `src/app/reviews/[reviewId]/page.tsx` implements review detail view.
- `src/app/review/[tmdbId]/page.tsx` implements Rate & Review and is wired to catalog + review APIs.
- `src/app/my-reviews/page.tsx` implements the My Reviews list view.
- `src/app/to-watch/page.tsx` implements the To Watch search and Watch Later list flow.
- `src/app/track/page.tsx` redirects legacy `/track` traffic to `/reviews`.
- `src/app/titles/[tmdbId]/page.tsx` implements hydrated title details.
- `src/app/lists/page.tsx` implements the Lists index and list creation flow.
- `src/app/lists/[listId]/edit/page.tsx` implements Curate Lists and is wired to list APIs.
- `src/app/sign-in/page.tsx` implements the sign-in form.
- `src/app/sign-up/page.tsx` implements the sign-up form.
- `src/app/sign-out/route.ts` clears the session and redirects.
- `src/app/me/page.tsx` implements a protected profile shell.

## Planned changes (not implemented)
- Apply typography tokens across pages.
- Add automated smoke tests and CI build gate.

## Planned Auth Migration
Phases:
1) Auth foundation: Better Auth setup, Prisma schema updates, seed initial user.
2) Session wiring: protect write routes, add session helpers, update UI states.
3) Ownership rollout: add user ownership to reviews/lists and backfill existing data.
4) Cutover: confirm per-user isolation and public browsing behavior.

Success criteria:
- Users can sign up, sign in, and sign out in production.
- Reviews/lists are scoped to the signed-in user by default.
- Protected routes block writes without a session.
- Admin-only actions require elevated role.

## Known blockers / risks
- No tests configured beyond linting.
- Production monitoring/alerts not yet configured.

## Next 5 tasks (ordered)
1) Manual QA pass for Reviews, Lists, To Watch, Review detail.
2) Lint cleanup: resolve remaining lint errors/warnings.
3) Apply typography tokens across pages.
4) Review entry flow: confirm dropdown alignment and close behavior after selection.
5) Add automated smoke tests for critical endpoints.
