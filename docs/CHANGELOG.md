# Changelog
Last updated: 2026-01-17

All notable changes to this project will be documented in this file.
This changelog follows the Keep a Changelog format.

## [Unreleased]
### Added
- Added (UI): Track Films page layout based on Stitch reference.
- Added (UI): Rate & Review page layout based on Stitch reference.
- Added (API): create reviews via `POST /api/reviews`.
- Added (UI): My Reviews page with list-style review entries.
- Added (UI): To Watch page with Watch Later list integration.
- Added (UI/API): Curate Lists page layout with catalog search results.
- Added (UI): Lists index page with list creation form.
- Added (API/UI): reviews list endpoint and Reviews page.
- Added (UI): hydrated title details page.
- Added (Scripts): API smoke test runner.
- Added (Auth): admin unlock page with cookie-based session.
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
- Changed (UI): update landing navigation to route Lists to `/lists`.
- Changed (UI): add My Reviews to app navigation headers.
- Changed (UI): add My Reviews to the landing page navigation.
- Changed (UI): add To Watch to app navigation headers.
- Changed (UI): add To Watch to the landing page navigation.
- Changed (UI): normalize catalog search dropdown layout across app search dropdowns.
- Changed (UI): remove the watched date input from the Reviews dashboard selection block.
- Changed (UI): update the Reviews dashboard action button label and remove the Top Genres panel.
- Changed (UI/API): stop sending watched date from the Reviews dashboard review creation.
- Changed (UI): move Recent lists above the create form and make list cards clickable.
- Changed (UI/API): auto-hydrate titles before adding list items in Curate Lists.
- Changed (UI): remove the Add more films block from Curate Lists.
- Changed (UI/API): show latest review info on list items and add Write review links.
- Changed (UI): make landing feature cards clickable and add links to new pages.
- Changed (UI): remove the New Arrivals section/components and simplify the landing footer.
- Changed (Docs): add pre-deploy checklist items to `docs/to_do.md`.
- Changed (Infra): rename middleware to proxy to match Next.js 16 conventions.
- Changed (UI): add header navigation links to Track, Review, and Curate Lists pages.
- Changed (UI/API): auto-hydrate review titles on load when admin passphrase is provided.
- Changed (UI): restore review search input for selecting titles.
- Changed (UI): keep selected review title after save.
- Changed (UI/API): validate list item notes and roll back on failed updates.
- Changed (UI): update nav links to point to Reviews list.
- Changed (UI): link Reviews list items to title details page.
- Changed (UI): add empty-state callouts for Track search, Review search, and Lists items.
- Changed (Auth): middleware guard for write pages when in public read-only mode.
- Changed (UI/API): wire Track Films search and log actions to catalog endpoints.
- Changed (UI): hide the admin passphrase input behind a disclosure on Track Films.
- Changed (UI/API): wire Rate & Review search and save actions to catalog endpoints.
- Changed (UI/API): submit reviews from the Rate & Review page to `POST /api/reviews`.
- Changed (UI): add a success toast and reset the Rate & Review form after save.
- Changed (UI): de-duplicate catalog search results in Track/Review/Lists.
- Changed (UI): remove unused header controls from Track/Review/Lists.
- Changed (UI/API): load review title metadata from the titles endpoint.
- Changed (UI): remove placeholder list items when list load fails.
- Changed (UI): ensure catalog search result keys are unique across media types.
- Changed (UI): fix duplicate keys in Track calendar headers.
- Changed (UI): remove unused header search on Review and Lists pages.
- Changed (UI): clear default list metadata placeholders before load.
- Changed (UI): consolidate Track into Reviews dashboard and remove the Reviews list page.
- Changed (Routing): add `/track` redirect to `/reviews` and update navigation links.
- Changed (UI): align app headers to landing theme and update branding to MyFilmLists.
- Changed (UI): standardize button styling via shared Button component and align Reviews theme with landing palette.
- Changed (UI): introduce CSS variables for core palette and replace hardcoded colors across app styles.
- Changed (UI): move hero and poster gradients into CSS variables for centralized theming.
- Changed (UI): add spacing/typography CSS tokens and wire header/button sizes to variables.
- Changed (UI): update Reviews dashboard with watched/logged date toggle, add-to-list action, and clickable recent items.
- Added (API/UI): review detail endpoint and page at `/reviews/{reviewId}`.
- Changed (UI): auto-log uses current time and search results collapse after selection.
- Changed (UI/API): "Log Film" now creates reviews and the recent list shows the latest 5 reviews.
- Changed (UI): review cards show excerpt + poster and link reliably to review detail.
- Fixed (API): review detail handler now falls back to URL path parsing when params are missing.

### Fixed
- Fixed (API): avoid const reassignment errors in catalog hydrate route.
- Fixed (API): accept tmdbId from params or path fallback in title details endpoint.
- Fixed (API): validate listId parsing for list detail and items endpoints.
- Fixed (UI): prevent list auto-save after delete to avoid invalid updates.
- Fixed (UI): normalize list item media type mapping for list edit state typing.
- Fixed (UI): guard list item rating rendering against undefined values.
- Fixed (UI): normalize recent review media types before mapping to dashboard entries.

### Removed
- Removed (API/DB/UI): diary entry model, endpoints, and dashboard copy.

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
- Fixed (Build): move admin unlock POST handler to API route to avoid page/route conflict.

### Removed
- None.

### Security
- Server-only env validation for required TMDB credentials.

---

## How to update this changelog
- Add entries under [Unreleased] during active work.
- Move items into a dated release section when shipping.
- Keep entries short and user-facing; link to issues/PRs when helpful.
