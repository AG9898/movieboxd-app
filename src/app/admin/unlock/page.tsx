import { Button } from "@/components/ui/Button";
import Link from "next/link";

type PageProps = {
  searchParams?: { next?: string; error?: string };
};

export default function AdminUnlockPage({ searchParams }: PageProps) {
  const nextPath = searchParams?.next ?? "/reviews";
  const hasError = searchParams?.error === "1";

  return (
    <div className="min-h-screen bg-[var(--app-panel)] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[var(--app-border)] bg-[var(--app-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--app-header-height)] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-primary)] text-white">
                <span className="text-xs font-semibold">ML</span>
              </div>
              <span className="text-lg font-bold tracking-tight">MyFilmLists</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-6 md:flex">
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/">
                Home
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/reviews">
                Reviews
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/lists">
                Lists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-lg">
          <h1 className="text-2xl font-bold">Admin unlock</h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Enter the admin passphrase to enable write access on this device.
          </p>

          {hasError ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Incorrect passphrase. Please try again.
            </div>
          ) : null}

          <form className="mt-6 flex flex-col gap-4" method="post" action="/api/admin/unlock">
            <input type="hidden" name="next" value={nextPath} />
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--app-muted)]">Admin passphrase</span>
              <input
                className="h-12 rounded-lg border border-[#2c3b59] bg-[var(--app-panel)] px-3 text-white focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]"
                name="passphrase"
                placeholder="Enter passphrase"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <Button type="submit">
              Unlock
            </Button>
          </form>

          <p className="mt-4 text-xs text-[var(--app-muted)]">
            Public browsing stays available when `PUBLIC_READONLY=true`.
          </p>
        </div>
      </main>
    </div>
  );
}
