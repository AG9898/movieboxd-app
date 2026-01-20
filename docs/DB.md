# Database (Supabase Postgres + Prisma)

## Why Supabase Postgres + Prisma
- Supabase provides a managed Postgres database with backups and easy connection strings.
- Prisma gives us type-safe access, migrations, and a clean data model in code.
- We use Supabase strictly as a managed Postgres provider, not for client-side auth or client SDK features.

## Security model
- All database writes happen server-side only.
- Prisma connects using `DATABASE_URL`.
- The Supabase service role key must NEVER be exposed to the browser.

## Ownership model
- Reviews and lists are owned by a user (`userId`).
- List items inherit ownership via their parent list.
- User profiles are stored separately from auth users.

## Auth tables
- `AuthUser`: primary auth identity (id, email, passwordHash).
- `UserProfile`: display-facing profile (username, displayName, bio, avatarUrl).

## Supabase project setup
1) Create a new project at https://supabase.com/dashboard.
2) Choose a project name, region, and database password.
3) Wait for provisioning to complete.

## Where to find the required values
Open your Supabase project and go to the Settings area:

### DATABASE_URL (for Prisma)
- Settings > Database > Connection string
- Use the pooled connection string for Prisma.
- Prisma uses `DATABASE_URL`.

### SUPABASE_URL
- Settings > API > Project URL

### SUPABASE_ANON_KEY
- Settings > API > Project API keys > anon public

### SUPABASE_SERVICE_ROLE_KEY
- Settings > API > Project API keys > service_role
- Keep this server-only and never expose it to the browser.
