# Session Start
Last updated: 2026-01-14

## Resume checklist
- `cd C:\Users\aden2\OneDrive\Desktop\projects\movieboxd\movieboxd`
- Install deps: `npm install`
- Env setup: `cp .env.example .env.local` then fill values in `.env.local`
- Prisma status/generate:
  - `npx prisma migrate status`
  - `npx prisma generate`
- Run dev server: `npm run dev`
- Key endpoints to verify:
  - `GET /api/health/db`
  - `GET /api/health/catalog`
  - `GET /api/catalog/search?q=matrix&type=movie&page=1`
  - `POST /api/catalog/hydrate` (requires `x-admin-passphrase` when `PUBLIC_READONLY=true`)
- When you change code: add a categorized entry under `docs/CHANGELOG.md` > [Unreleased] (see `docs/CONVENTIONS.md`).
- Optional quality checks:
  - Lint: `npm run lint`
  - Tests: no test runner configured yet

## What to tell Codex first
"Please read `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, `docs/CONVENTIONS.md`, and `docs/to_do.md`, then summarize the top 3 risks or blockers before making changes."
