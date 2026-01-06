This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

```bash
cp .env.example .env.local
```

Update `.env.local` with your values (at minimum `TMDB_API_KEY`), then restart
the dev server after any env changes so Next.js picks them up.

## Database setup

See `docs/DB.md` for Supabase project setup, connection strings, and key usage.

### Prisma CLI

Generate Prisma Client:

```bash
npx prisma generate
```

Run migrations (dev):

```bash
npx prisma migrate dev
```

Run migrations (prod):

```bash
npx prisma migrate deploy
```

Warning: `prisma migrate dev` can reset or modify data during development. Avoid
running destructive migrations on production data without a backup plan.

### Seed data

```bash
npm run db:seed
```

### API examples (local)

```powershell
# Catalog search
curl.exe "http://localhost:3000/api/catalog/search?q=matrix&type=movie&page=1"

# Catalog hydrate (admin-only when PUBLIC_READONLY=true)
curl.exe -X POST "http://localhost:3000/api/catalog/hydrate" ^
  -H "Content-Type: application/json" ^
  -H "x-admin-passphrase: <ADMIN_PASSPHRASE>" ^
  -d "{\"source\":\"tmdb\",\"mediaType\":\"movie\",\"externalId\":603}"

# Titles query
curl.exe "http://localhost:3000/api/titles?query=matrix"
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Database health check

```bash
curl http://localhost:3000/api/health/db
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
