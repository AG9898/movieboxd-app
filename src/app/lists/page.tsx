"use client";

import AuthNav from "@/components/auth/AuthNav";
import { useRequireSession } from "@/components/auth/useRequireSession";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  privacy: "public" | "private" | "friends";
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message?: string } };

const privacyLabel: Record<ListSummary["privacy"], string> = {
  public: "Public",
  private: "Private",
  friends: "Friends only",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ListsIndexPage() {
  const { isLoading: isSessionLoading } = useRequireSession();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<ListSummary["privacy"]>("public");
  const [isCreating, setIsCreating] = useState(false);

  const trimmedName = name.trim();
  const canCreate = trimmedName.length > 0 && !isCreating;

  useEffect(() => {
    let cancelled = false;

    const fetchLists = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lists");
        const payload = (await response.json()) as ApiResponse<ListSummary[]>;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load lists." : payload.error?.message);
        }
        if (!cancelled) {
          setLists(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load lists.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchLists();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(handle);
  }, [toast]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [lists]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName) {
      setToast("List name is required.");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || undefined,
          privacy,
        }),
      });
      const payload = (await response.json()) as ApiResponse<ListSummary>;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Failed to create list." : payload.error?.message);
      }

      setLists((current) => [payload.data, ...current]);
      setName("");
      setDescription("");
      setPrivacy("public");
      setToast("List created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create list.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] text-white">
        <main className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--app-muted)]">Loading your lists...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
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
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/my-reviews">
                My Reviews
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/to-watch">
                To Watch
              </Link>
              <Link className="text-sm font-medium text-white" href="/lists">
                Lists
              </Link>
              <AuthNav />
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Your lists</h1>
            <span className="text-xs text-[var(--app-muted)]">
              {isLoading ? "Loading..." : `${sortedLists.length} total`}
            </span>
          </div>
          <p className="text-sm text-[var(--app-muted)]">
            Organize favorites, watchlists, or themed collections.
          </p>

          {isLoading ? (
            <div className="rounded-xl border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-muted)]">
              Loading lists...
            </div>
          ) : null}

          {!isLoading && sortedLists.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface)] p-6 text-center text-sm text-[var(--app-muted)]">
              No lists yet. Create one below to get started.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {sortedLists.map((list) => (
              <Link
                key={list.id}
                className="group flex h-full flex-col justify-between rounded-2xl border border-[var(--app-border-strong)]/40 bg-[var(--app-surface)] p-5 shadow-sm transition-colors hover:border-[var(--app-primary)]/60"
                href={`/lists/${list.id}/edit`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{list.name}</p>
                      <p className="text-xs text-[var(--app-muted)]">
                        {privacyLabel[list.privacy]} • Updated {formatDate(list.updatedAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--app-border-strong)] px-2 py-1 text-[11px] text-[var(--app-muted)]">
                      {list.privacy}
                    </span>
                  </div>
                  <p className="text-sm text-[#c6d1ea]">
                    {list.description ? list.description : "No description yet."}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-[var(--app-muted)]">
                  <span className="text-xs">Created {formatDate(list.createdAt)}</span>
                  <span className="text-xs font-semibold text-white transition-colors group-hover:text-[var(--app-primary)]">
                    Edit list →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Create a list</h2>
            <p className="text-sm text-[var(--app-muted)]">
              Start a new collection in seconds.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">List name</span>
                <input
                  className="h-12 w-full rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-panel)] p-3 text-white focus:border-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                  placeholder="Weekend rewatches"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Privacy</span>
                <div className="relative">
                  <select
                    className="h-12 w-full appearance-none rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-panel)] p-3 text-white focus:border-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                    value={privacy}
                    onChange={(event) => setPrivacy(event.target.value as ListSummary["privacy"])}
                  >
                    <option value="public">Public - Visible to everyone</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Private</option>
                  </select>
                  <span className="absolute right-3 top-3 text-gray-500">▼</span>
                </div>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Description</span>
              <textarea
                className="min-h-[80px] w-full resize-y rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-panel)] p-3 text-white focus:border-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                placeholder="A short note about this list..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[var(--app-muted)]">
                {error ? <span className="text-red-300">{error}</span> : ""}
                {toast ? <span className="text-emerald-300">{toast}</span> : ""}
              </div>
              <Button type="submit" disabled={!canCreate} className="px-6">
                {isCreating ? "Creating..." : "Create list"}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
