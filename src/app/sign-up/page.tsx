import AuthNav from "@/components/auth/AuthNav";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type PageProps = {
  searchParams?: { next?: string; error?: string };
};

export default function SignUpPage({ searchParams }: PageProps) {
  const nextPath = searchParams?.next ?? "/me";
  const errorMessage =
    searchParams?.error === "server"
      ? "Sign-up is temporarily unavailable. Try again after migrations run."
      : null;

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
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/reviews"
              >
                Reviews
              </Link>
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/my-reviews"
              >
                My Reviews
              </Link>
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/to-watch"
              >
                To Watch
              </Link>
              <Link
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                href="/lists"
              >
                Lists
              </Link>
              <AuthNav />
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-lg">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Set up your profile to track reviews and lists.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <form className="mt-6 flex flex-col gap-4" action="/api/auth/sign-up" method="post">
            <input type="hidden" name="next" value={nextPath} />
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--app-muted)]">Name</span>
              <input
                className="h-12 rounded-lg border border-[#2c3b59] bg-[var(--app-panel)] px-3 text-white focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]"
                name="name"
                placeholder="Your name"
                type="text"
                autoComplete="name"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--app-muted)]">Email</span>
              <input
                className="h-12 rounded-lg border border-[#2c3b59] bg-[var(--app-panel)] px-3 text-white focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]"
                name="email"
                placeholder="you@example.com"
                type="email"
                required
                autoComplete="email"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--app-muted)]">Password</span>
              <input
                className="h-12 rounded-lg border border-[#2c3b59] bg-[var(--app-panel)] px-3 text-white focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]"
                name="password"
                placeholder="Create a password"
                type="password"
                required
                autoComplete="new-password"
              />
            </label>
            <Button type="submit">Create account</Button>
          </form>

          <p className="mt-4 text-sm text-[var(--app-muted)]">
            Already have an account?{" "}
            <Link className="text-white hover:text-[var(--app-primary)]" href="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
