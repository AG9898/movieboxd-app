import AuthNav from "@/components/auth/AuthNav";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in?next=/me");
  }

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

      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-lg">
          <h1 className="text-2xl font-bold">Your profile</h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            This is a minimal profile shell while Better Auth is being integrated.
          </p>
          <dl className="mt-6 grid gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-[var(--app-muted)]">Name</dt>
              <dd className="text-white">{user.name ?? "Not set"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[var(--app-muted)]">Email</dt>
              <dd className="text-white">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[var(--app-muted)]">Account ID</dt>
              <dd className="text-white">{user.id}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
