# FilmTrack (Personal Letterboxd-Style) — Architecture & Build Spec (Codex)

## 0. Purpose
Build a deployed personal film tracker (Letterboxd-like) with:
- No user accounts / multi-user system
- A single “owner/admin” mode for write operations
- Public read-only browsing optional (configurable)
- React + TypeScript + Tailwind + Next.js (App Router)
- Supabase Postgres as DB, Prisma ORM

This doc is the source of truth for Codex implementation decisions.

---

## 1. Scope

### Must-have features (MVP)
1) Catalog search (movies + TV) via external API, cached locally
2) Diary / watched logs (date watched, rating, rewatch flag, notes)
3) Reviews (rich text optional later; start plain text), tags, spoiler flag, like flag
4) Lists (create/edit lists, privacy setting, order, notes per item)
5) Landing page + Track Films + Rate & Review + Curate Lists pages
6) Dark UI matching Stitch designs
7) Security/privacy controls suitable for “no accounts”

### Non-goals (for now)
- Social graph, comments, follows
- Multiple accounts / roles
- Real-time chat/notifications
- Complex recommendation engine

---

## 2. Tech stack

### Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Icon strategy: prefer `lucide-react` or `@heroicons/react` (avoid runtime Google icon fonts when possible)

### Backend
- Next.js Route Handlers and/or Server Actions
- Zod for request validation
- Prisma ORM
- Supabase Postgres

### Deployment
- Vercel (recommended) or Fly.io
- Supabase managed Postgres

---

## 3. “No Accounts” Security Model (IMPORTANT)

We still need a way to prevent public write access when deployed.

### 3.1 Modes
- PUBLIC_READONLY=true: anyone can browse; writes are blocked unless admin
- PUBLIC_READONLY=false: entire app behind “simple gate” (Basic Auth / passphrase)

### 3.2 Admin authentication (no users)
Implement ONE of these (choose A by default):

A) **Admin passphrase cookie** (recommended UX)
- A single passphrase (ENV: ADMIN_PASSPHRASE)
- `/admin/unlock` sets HttpOnly cookie `ft_admin=...` (signed)
- Middleware protects write pages + API routes

B) **HTTP Basic Auth** at middleware level
- Uses ENV: BASIC_AUTH_USER, BASIC_AUTH_PASS
- Blocks everything except landing page if desired

C) **Write API key header**
- Requests must include `x-ft-admin: <token>` to mutate
- Good for scripts; less friendly for browser UX

### 3.3 Database security (Supabase)
- Enable RLS on all tables
- Public role: SELECT only (optional)
- Writes only via server using Supabase service role key OR direct DB connection from server

DO NOT expose service role key to the browser.
Use server-only env vars.

---

## 4. Repo structure (single Next app)

.
+- app/
¦  +- (marketing)/
¦  ¦  +- page.tsx                  # Landing
¦  +- (app)/
¦  ¦  +- track/page.tsx            # Track Films
¦  ¦  +- review/[tmdbId]/page.tsx  # Rate & Review (a title)
¦  ¦  +- lists/
¦  ¦  ¦  +- page.tsx               # List index
¦  ¦  ¦  +- [listId]/edit/page.tsx # Curate list
¦  ¦  +- layout.tsx                # App shell layout
¦  +- api/
¦  ¦  +- catalog/search/route.ts
¦  ¦  +- catalog/hydrate/route.ts
¦  ¦  +- diary/log/route.ts
¦  ¦  +- reviews/route.ts
¦  ¦  +- lists/route.ts
¦  ¦  +- lists/[listId]/items/route.ts
¦  +- layout.tsx                   # Root layout
¦  +- globals.css
+- components/
¦  +- shell/
¦  ¦  +- Header.tsx
¦  ¦  +- Footer.tsx
¦  ¦  +- AppShell.tsx
¦  +- catalog/
¦  ¦  +- SearchBar.tsx
¦  ¦  +- PosterCard.tsx
¦  ¦  +- PosterGrid.tsx
¦  +- diary/
¦  ¦  +- LogFilmCard.tsx
¦  ¦  +- RatingStars.tsx
¦  ¦  +- CalendarWidget.tsx
¦  ¦  +- StatsCards.tsx
¦  +- lists/
¦  ¦  +- ListEditor.tsx
¦  ¦  +- ListItemRow.tsx
¦  ¦  +- SortViewToggle.tsx
¦  +- ui/                           # shared UI primitives (buttons, inputs)
+- lib/
¦  +- db.ts                         # Prisma client
¦  +- auth.ts                       # admin session helpers
¦  +- env.ts                        # env validation (Zod)
¦  +- tmdb.ts                       # external API client
¦  +- rateLimit.ts                  # basic rate limiting
¦  +- securityHeaders.ts            # CSP, etc.
+- prisma/
¦  +- schema.prisma
¦  +- migrations/
+- design/
¦  +- landing.html                  # Store your Stitch reference HTML
¦  +- track.html
¦  +- review.html
¦  +- lists.html
+- docs/
¦  +- ARCHITECTURE.md
¦  +- API.md
¦  +- SECURITY.md
¦  +- RUNBOOK.md
+- package.json

Codex: treat files in /design as the source-of-truth for UI structure & Tailwind classes.
Convert them into React components in /components and Next pages in /app.

---

## 5. Data Model (Prisma)

### 5.1 Entities
- Title: cached movie/show from external API (TMDB primary)
- DiaryEntry: a watch log (date, rating, rewatch, notes)
- Review: text review + tags + spoiler/like flags
- List: named list with privacy and description
- ListItem: join of List <-> Title with rank/order and note
- Tag: normalized tags

### 5.2 Prisma schema draft (to implement)

- Title
  - id (uuid)
  - tmdbId (int, unique)
  - mediaType ("movie" | "tv")
  - title, originalTitle
  - releaseDate
  - posterPath, backdropPath
  - overview
  - runtimeMinutes (nullable)
  - genres (string[] or normalized table later)
  - popularity (float) (optional)
  - createdAt, updatedAt

- DiaryEntry
  - id (uuid)
  - titleId (fk Title)
  - watchedOn (date)
  - rating (decimal(2,1) or int 0..10)
  - liked (bool)
  - rewatch (bool)
  - notes (text)
  - createdAt, updatedAt
  - unique constraint: (titleId, watchedOn) optional (allow multiple watches same day? decide)

- Review
  - id (uuid)
  - titleId (fk Title)
  - watchedOn (date nullable)
  - rating (same scale as DiaryEntry)
  - containsSpoilers (bool)
  - liked (bool)
  - body (text)
  - createdAt, updatedAt

- Tag
  - id (uuid)
  - name (citext unique)
- ReviewTag (join)
  - reviewId, tagId

- List
  - id (uuid)
  - name (text)
  - description (text)
  - privacy ("public" | "private")
  - createdAt, updatedAt

- ListItem
  - id (uuid)
  - listId (fk List)
  - titleId (fk Title)
  - rank (int)
  - note (text)
  - unique constraint: (listId, titleId)

---

## 6. External Catalog Strategy (TMDB primary)

### 6.1 Goals
- Search external API for titles
- On selection, “hydrate” and upsert into local Title table
- Subsequent pages use local DB to render quickly

### 6.2 API client rules
- All external API calls happen server-side only
- Cache responses:
  - Use Next `fetch(..., { next: { revalidate: 86400 } })` for trending lists
  - Persist selected titles in DB

---

## 7. API Design (Next Route Handlers)

### 7.1 Conventions
- Validate input with Zod
- Return JSON with shape:
  - { ok: true, data: ... } or { ok: false, error: { code, message, details? } }
- Use pagination: `?cursor=...&limit=...` for lists
- Protect mutating routes (POST/PUT/DELETE) with admin auth middleware

### 7.2 Routes (MVP)
- GET  /api/catalog/search?q=...&type=movie|tv|multi
- POST /api/catalog/hydrate { tmdbId, mediaType }
- POST /api/diary/log { tmdbId, watchedOn, rating, liked, rewatch, notes }
- POST /api/reviews { tmdbId, rating, watchedOn?, containsSpoilers, liked, body, tags[] }
- GET  /api/lists
- POST /api/lists { name, description, privacy }
- PUT  /api/lists/{listId}
- POST /api/lists/{listId}/items { tmdbId, rank, note }
- PUT  /api/lists/{listId}/items (bulk reorder)

---

## 8. Page Implementation Plan (convert Stitch HTML)

### 8.1 Global styling
- Tailwind configured for dark mode via `class`
- Move Stitch tailwind.config colors into `tailwind.config.ts` theme.extend
- Create design tokens:
  - colors.primary, background-dark, surface-dark, surface-highlight, text-muted, etc.

### 8.2 Layout Components
- `components/shell/Header.tsx`
  - match Stitch nav structure:
    - logo left
    - search bar center (md+)
    - nav links
    - right actions
- `components/shell/Footer.tsx` for landing
- `components/shell/AppShell.tsx` wraps app routes

### 8.3 Landing page
Convert `/design/landing.html` into:
- app/(marketing)/page.tsx
- components:
  - HeroSection
  - FeatureCardsRow
  - NewArrivalsGrid (static mock until wired to API)

### 8.4 Track Films page
Convert `/design/track.html` into:
- app/(app)/track/page.tsx
- components:
  - LogFilmCard (search title + watched date + rating + like + notes + submit)
  - RecentlyWatchedGrid
  - StatsCards
  - CalendarWidget
  - GenreStats

### 8.5 Rate & Review page
Convert `/design/review.html` into:
- app/(app)/review/[tmdbId]/page.tsx
- components:
  - PosterSummaryCard
  - RatingStars (interactive)
  - ReviewEditor (textarea now; rich editor later)
  - TagInput (chips)

### 8.6 Curate Lists page
Convert `/design/lists.html` into:
- app/(app)/lists/[listId]/edit/page.tsx
- components:
  - ListMetadataEditor
  - ListToolbar (search-to-add, sort, view toggle)
  - ListItemRow (drag handle optional later)
  - StickyActionBar

---

## 9. Security/Privacy Checklist (must implement)

### 9.1 App protections
- Middleware for admin-only routes
- CSRF protection for POST requests (double submit cookie or origin checks)
- Rate limit `/api/catalog/search` to avoid abuse
- Secure headers (CSP, X-Frame-Options, Referrer-Policy)
- Don’t log secrets or raw cookies
- Validate all inputs with Zod

### 9.2 Supabase & secrets
- Service role key must remain server-only
- ENV validation at startup (Zod)
- Separate env for local/dev/prod
- Backups: enable Supabase PITR if available, and schedule export

---

## 10. Testing & Quality Gates
- Unit tests: Zod schemas, utility functions
- Integration: API routes (happy + invalid)
- E2E (optional): Playwright smoke tests for main flows
- Lint + format:
  - eslint
  - prettier
  - typecheck in CI

---

## 11. Codex Execution Rules
- Always create/modify code in small commits:
  - (1) scaffolding + types
  - (2) DB schema + migrations
  - (3) API routes
  - (4) UI components per page
- Do not “invent UI” — follow /design HTML structure and Tailwind classes
- Prefer composing from components; keep pages thin
- Every POST route must enforce admin auth
- Add a `README.md` with local dev setup and env vars
- Add `docs/API.md` documenting request/response examples for each route

Acceptance criteria for MVP:
- Landing renders and matches design
- Track page allows logging a title selected from search and saves to DB
- Review page saves a review + tags
- Lists page creates/edits a list and adds titles
- Deployed instance cannot be written to without admin unlock