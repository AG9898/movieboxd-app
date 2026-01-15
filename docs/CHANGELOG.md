# Changelog
Last updated: 2026-01-14

All notable changes to this project will be documented in this file.
This changelog follows the Keep a Changelog format.

## [Unreleased]
### Added
- Added (UI): Track Films page layout based on Stitch reference.
- Added (UI): Rate & Review page layout based on Stitch reference.
- Added (API): create reviews via `POST /api/reviews`.
- Added (API): create diary entries via `POST /api/diary/log`.
- Added (UI/API): Curate Lists page layout with catalog search results.
- Added (API): list endpoints for create/update and list item management.
- Changed (UI/API): wire Curate Lists save and add-item actions to list endpoints.
- Added (API): list item read/delete endpoints.
- Changed (UI/API): load and remove list items from Curate Lists via list APIs.
- Changed (UI/API): add drag-and-drop reorder with auto-save to list bulk endpoint.
- Added (API): list detail fetch and delete endpoints.
- Changed (UI): add list preview modal and wire delete action in Curate Lists.
- Changed (UI/API): auto-load list metadata in Curate Lists editor.
- Changed (API): allow list item note updates via `PUT /api/lists/{listId}/items`.
- Changed (UI/API): save list item notes on blur in Curate Lists.
- Changed (UI/API): auto-save list metadata on edit.
- Changed (UI): auto-save errors now roll back list metadata to last saved values.
- Changed (UI): wire landing page navigation and remove unused header actions.
- Added (API): fetch title details via `GET /api/titles/{tmdbId}`.

### Changed
- Changed (UI): replace the default Next.js home page with a custom landing layout.
- Changed (UI): align the landing page with Stitch reference layout and sections.
- Changed (UI/API): wire Track Films search and log actions to catalog endpoints.
- Changed (UI): hide the admin passphrase input behind a disclosure on Track Films.
- Changed (UI/API): wire Rate & Review search and save actions to catalog endpoints.
- Changed (UI/API): submit reviews from the Rate & Review page to `POST /api/reviews`.
- Changed (UI): add a success toast and reset the Rate & Review form after save.
- Changed (UI/API): submit Track Films log entries to `POST /api/diary/log`.
- Added (API): list recent diary entries via `GET /api/diary`.
- Changed (UI/API): wire Track Films recent entries to diary API.
- Changed (API): add month/year filters to `GET /api/diary`.
- Changed (UI): wire "This Month" filter to diary API.
- Changed (UI): de-duplicate catalog search results in Track/Review/Lists.
- Changed (UI): remove unused header controls from Track/Review/Lists.
- Changed (UI/API): load review title metadata from the titles endpoint.
- Changed (UI): remove placeholder list items when list load fails.
- Changed (UI): ensure catalog search result keys are unique across media types.
- Changed (UI): fix duplicate keys in Track calendar headers.
- Changed (UI): remove unused header search on Review and Lists pages.
- Changed (UI): clear default list metadata placeholders before load.

### Fixed
- None.

### Removed
- None.

### Security
- None.

## [2026-01-14]
### Added
- Catalog search API (`/api/catalog/search`) with TMDB primary and TVMaze fallback for TV.
- Catalog hydrate API (`/api/catalog/hydrate`) to upsert titles into Prisma.
- Titles query API (`/api/titles`) to search local catalog.
- Health endpoints: `/api/health/catalog`, `/api/health/db`, `/api/health/db-stats`.
- Prisma schema for titles, diary, reviews, lists, and tags with an initial migration.
- Admin write protection via `PUBLIC_READONLY` + `x-admin-passphrase` header.
- Rate limiting for catalog search.
- Security headers middleware.

### Changed
- Prisma client configured to use the library engine in `prisma/schema.prisma`.

### Fixed
- None.

### Removed
- None.

### Security
- Server-only env validation for required TMDB credentials.

---

## How to update this changelog
- Add entries under [Unreleased] during active work.
- Move items into a dated release section when shipping.
- Keep entries short and user-facing; link to issues/PRs when helpful.
