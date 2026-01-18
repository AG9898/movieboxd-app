"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CatalogResult = {
  source: "tmdb" | "tvmaze";
  mediaType: "movie" | "tv";
  externalId: number;
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
};

type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  privacy: "public" | "private" | "friends";
  createdAt: string;
  updatedAt: string;
};

type ListItemSummary = {
  id: string;
  title: {
    tmdbId: number;
    mediaType: "movie" | "tv";
    title: string;
    releaseDate: string | null;
    posterPath: string | null;
  };
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message?: string } };

const watchLaterName = "Watch Later";

export default function ToWatchPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "tv" | "multi">("movie");
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [selected, setSelected] = useState<CatalogResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminPassphrase, setAdminPassphrase] = useState("");
  const [watchLaterId, setWatchLaterId] = useState<string | null>(null);
  const [watchLaterCount, setWatchLaterCount] = useState<number | null>(null);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  const resultLabel = useMemo(() => {
    if (!canSearch) return "Type 2+ characters to search.";
    if (isSearching) return "Searching catalog...";
    if (results.length === 0) return "No results yet.";
    return `${results.length} results`;
  }, [canSearch, isSearching, results.length]);

  useEffect(() => {
    if (!successMessage) return;
    const handle = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(handle);
  }, [successMessage]);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const url = new URL("/api/catalog/search", window.location.origin);
        url.searchParams.set("q", trimmedQuery);
        url.searchParams.set("type", searchType);
        const response = await fetch(url.toString());
        const payload = (await response.json()) as
          | { ok: true; data: { results: CatalogResult[] } }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Catalog search failed." : payload.error?.message);
        }

        if (!cancelled) {
          const uniqueResults = Array.from(
            new Map(
              payload.data.results.map((item) => [
                `${item.source}-${item.externalId}-${item.mediaType}`,
                item,
              ])
            ).values()
          );
          setResults(uniqueResults);
        }
      } catch (searchError) {
        if (!cancelled) {
          setResults([]);
          setError(
            searchError instanceof Error ? searchError.message : "Catalog search failed."
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [canSearch, searchType, trimmedQuery]);

  useEffect(() => {
    if (!selected) return;
    if (trimmedQuery === selected.title) {
      setResults([]);
    }
  }, [selected, trimmedQuery]);

  const showResults = results.length > 0 && (!selected || trimmedQuery !== selected.title);

  async function fetchWatchLaterList(): Promise<ListSummary | null> {
    const response = await fetch("/api/lists");
    const payload = (await response.json()) as ApiResponse<ListSummary[]>;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "Failed to load lists." : payload.error?.message);
    }
    const match = payload.data.find(
      (list) => list.name.trim().toLowerCase() === watchLaterName.toLowerCase()
    );
    if (match) {
      setWatchLaterId(match.id);
      return match;
    }
    return null;
  }

  async function ensureWatchLaterList(): Promise<string> {
    if (watchLaterId) return watchLaterId;
    const existing = await fetchWatchLaterList();
    if (existing) return existing.id;

    const response = await fetch("/api/lists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
      },
      body: JSON.stringify({
        name: watchLaterName,
        description: "Titles to watch later.",
        privacy: "private",
      }),
    });
    const payload = (await response.json()) as ApiResponse<ListSummary>;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "Failed to create Watch Later list." : payload.error?.message);
    }
    setWatchLaterId(payload.data.id);
    return payload.data.id;
  }

  async function fetchWatchLaterItems(listId: string): Promise<ListItemSummary[]> {
    const response = await fetch(`/api/lists/${listId}/items`);
    const payload = (await response.json()) as ApiResponse<ListItemSummary[]>;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "Failed to load Watch Later items." : payload.error?.message);
    }
    setWatchLaterCount(payload.data.length);
    return payload.data;
  }

  async function handleAddToWatchLater() {
    if (!selected) {
      setError("Select a title before adding.");
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      const listId = await ensureWatchLaterList();
      const items = await fetchWatchLaterItems(listId);
      const exists = items.some(
        (item) =>
          item.title.tmdbId === selected.externalId &&
          item.title.mediaType === selected.mediaType
      );
      if (exists) {
        setSuccessMessage("Already in Watch Later.");
        return;
      }

      const hydrateResponse = await fetch("/api/catalog/hydrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({
          source: selected.source,
          externalId: selected.externalId,
          mediaType: selected.mediaType,
        }),
      });
      const hydratePayload = (await hydrateResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };
      if (!hydrateResponse.ok || !hydratePayload.ok) {
        throw new Error(
          hydratePayload.ok ? "Catalog hydrate failed." : hydratePayload.error?.message
        );
      }

      const addResponse = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({
          tmdbId: selected.externalId,
          mediaType: selected.mediaType,
          rank: items.length + 1,
          note: "",
        }),
      });
      const addPayload = (await addResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };
      if (!addResponse.ok || !addPayload.ok) {
        throw new Error(addPayload.ok ? "Add to Watch Later failed." : addPayload.error?.message);
      }

      setSuccessMessage("Added to Watch Later.");
      setWatchLaterCount((current) => (current === null ? items.length + 1 : current + 1));
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Add to Watch Later failed.");
    } finally {
      setIsAdding(false);
    }
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
              <Link className="text-sm font-medium text-white" href="/to-watch">
                To Watch
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/lists">
                Lists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">To Watch</h1>
            <p className="text-sm text-[var(--app-muted)]">
              Build a Watch Later list from catalog search results.
            </p>
          </div>
          <Link
            className="inline-flex items-center rounded-lg border border-[var(--app-border-strong)] px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-[var(--app-primary)] hover:text-white"
            href="/lists"
          >
            View lists
          </Link>
        </div>

        {successMessage ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Search the catalog</span>
              <div className="flex w-full items-center gap-3 rounded-lg bg-[var(--app-border)] focus-within:ring-2 focus-within:ring-[var(--app-primary)]/50">
                <input
                  className="w-full border-none bg-transparent px-4 py-3 text-base text-white placeholder-[var(--app-muted)] focus:ring-0"
                  placeholder="Search for a film title..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  className="mr-3 rounded-md bg-[var(--app-border-strong)] px-2 py-1 text-xs text-white"
                  value={searchType}
                  onChange={(event) =>
                    setSearchType(event.target.value as "movie" | "tv" | "multi")
                  }
                >
                  <option value="movie">Movies</option>
                  <option value="tv">TV</option>
                  <option value="multi">All</option>
                </select>
              </div>
            </label>

            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-xs text-[var(--app-muted)]">
              <div className="flex items-center justify-between">
                <span>{resultLabel}</span>
                {error ? <span className="text-red-300">{error}</span> : null}
              </div>
              {showResults ? (
                <div className="mt-3 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 sm:mx-auto sm:max-w-[720px]">
                  {results.map((item) => {
                    const isSelected = selected?.externalId === item.externalId;
                    return (
                      <button
                        key={`${item.source}-${item.externalId}-${item.mediaType}`}
                        className={`grid w-full min-h-[64px] grid-cols-[56px_1fr] items-center justify-items-start gap-x-4 rounded-lg border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-[var(--app-primary)] bg-[var(--app-border)] text-white"
                            : "border-transparent bg-[var(--app-card)] text-slate-200 hover:border-[var(--app-border-strong)]"
                        }`}
                        onClick={() => {
                          setSelected(item);
                          setQuery(item.title);
                          setResults([]);
                        }}
                        type="button"
                      >
                        <div
                          className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[var(--app-border)] bg-cover bg-center"
                          style={{
                            backgroundImage: item.posterUrl
                              ? `url('${item.posterUrl}')`
                              : "var(--app-gradient-poster)",
                          }}
                        />
                        <div className="flex min-w-0 flex-col justify-center">
                          <p className="truncate text-sm font-semibold">{item.title}</p>
                          <p className="truncate text-xs text-[var(--app-muted)]">
                            {item.mediaType.toUpperCase()}
                            {item.year ? ` · ${item.year}` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {!isSearching && canSearch && results.length === 0 && !error ? (
                <div className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-xs text-[var(--app-muted)]">
                  No matches yet. Try a different title or switch the search type.
                </div>
              ) : null}
            </div>

            {selected ? (
              <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    className="h-16 w-12 shrink-0 rounded bg-cover bg-center"
                    style={{
                      backgroundImage: selected.posterUrl
                        ? `url('${selected.posterUrl}')`
                        : "var(--app-gradient-poster)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{selected.title}</p>
                    <p className="text-xs text-[var(--app-muted)]">
                      {selected.mediaType.toUpperCase()}
                      {selected.year ? ` · ${selected.year}` : ""}
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center rounded-lg bg-[var(--app-primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                    onClick={handleAddToWatchLater}
                    disabled={isAdding}
                    type="button"
                  >
                    {isAdding ? "Adding..." : "Add to watch later"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 text-xs text-[var(--app-muted)]">
              <details className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  Admin passphrase (only if writes are locked)
                </summary>
                <div className="mt-2">
                  <input
                    className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-border)] px-3 py-2 text-sm text-white placeholder-[var(--app-muted)]"
                    placeholder="Optional admin passphrase"
                    type="password"
                    value={adminPassphrase}
                    onChange={(event) => setAdminPassphrase(event.target.value)}
                  />
                </div>
              </details>
              <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
                <span>
                  Watch Later list: {watchLaterId ? "ready" : "not created yet"}
                </span>
                {watchLaterCount !== null ? (
                  <span>{watchLaterCount} saved</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
