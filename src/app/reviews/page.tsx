"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
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

type DiaryStats = {
  total: number;
  yearCount: number;
  monthCount: number;
  avgRating: number;
};

type ReviewSummary = {
  id: string;
  title: {
    tmdbId: number;
    mediaType: "movie" | "tv";
    title: string;
    posterPath: string | null;
    releaseDate: string | null;
  };
  watchedOn: string | null;
  rating: number | null;
  liked: boolean;
  containsSpoilers: boolean;
  body: string;
  tags: string[];
  createdAt: string;
};

type RecentEntry = {
  id: string;
  title: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  date: string;
  rating: number;
  rewatch: boolean;
  image: string | null;
  body: string;
  liked: boolean;
  containsSpoilers: boolean;
};

const genreStats = [
  { label: "Sci-Fi", value: 28, width: "w-[75%]" },
  { label: "Drama", value: 15, width: "w-[50%]" },
  { label: "Action", value: 8, width: "w-[30%]" },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex text-[var(--app-primary)] text-[10px] gap-0.5">
      {[1, 2, 3, 4, 5].map((index) => {
        const diff = rating - index;
        const isFull = diff >= 0;
        const isHalf = diff >= -0.5 && diff < 0;
        const opacity = isFull ? "opacity-100" : isHalf ? "opacity-60" : "opacity-30";
        return (
          <svg
            key={index}
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${opacity}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l2.9 6.4 7.1.7-5.3 4.7 1.6 6.8-6.3-3.6-6.3 3.6 1.6-6.8L2 9.1l7.1-.7L12 2z" />
          </svg>
        );
      })}
    </div>
  );
}

export default function ReviewsDashboardPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "tv" | "multi">("multi");
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [selected, setSelected] = useState<CatalogResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminPassphrase, setAdminPassphrase] = useState("");
  const [watchedOn, setWatchedOn] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatch, setRewatch] = useState(false);
  const [notes, setNotes] = useState("");
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [stats, setStats] = useState<DiaryStats>({
    total: 0,
    yearCount: 0,
    monthCount: 0,
    avgRating: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

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
    let cancelled = false;
    const fetchStats = async () => {
      setIsStatsLoading(true);
      setStatsError(null);
      try {
        const now = new Date();
        const url = new URL("/api/diary/stats", window.location.origin);
        url.searchParams.set("month", String(now.getMonth() + 1));
        url.searchParams.set("year", String(now.getFullYear()));
        const response = await fetch(url.toString());
        const payload = (await response.json()) as
          | { ok: true; data: DiaryStats }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load stats." : payload.error?.message);
        }

        if (!cancelled) {
          setStats(payload.data);
        }
      } catch (statsLoadError) {
        if (!cancelled) {
          setStatsError(
            statsLoadError instanceof Error ? statsLoadError.message : "Failed to load stats."
          );
        }
      } finally {
        if (!cancelled) {
          setIsStatsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = useMemo(() => {
    const avgRating = stats.avgRating ? stats.avgRating.toFixed(1) : "0.0";
    return [
      { label: "Total", value: stats.total.toLocaleString() },
      { label: "This Year", value: stats.yearCount.toLocaleString() },
      { label: "This Month", value: stats.monthCount.toLocaleString() },
      { label: "Avg Rating", value: avgRating, delta: "/ 5", isAverage: true },
    ];
  }, [stats]);

  useEffect(() => {
    let cancelled = false;
    const fetchRecent = async () => {
      setIsRecentLoading(true);
      setRecentError(null);
      try {
        const url = new URL("/api/reviews", window.location.origin);
        url.searchParams.set("limit", "5");
        const response = await fetch(url.toString());
        const payload = (await response.json()) as
          | { ok: true; data: ReviewSummary[] }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load reviews." : payload.error?.message);
        }

        if (!cancelled) {
          const mapped = payload.data
            .filter((entry) => Boolean(entry.id))
            .map((entry) => {
            const ratingValue = entry.rating ?? 0;
            const dateValue = entry.watchedOn ?? entry.createdAt;
            return {
              id: entry.id,
                title: entry.title.title,
                tmdbId: entry.title.tmdbId,
                mediaType: entry.title.mediaType === "tv" ? "tv" : "movie",
                date: new Date(dateValue).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                }),
                rating: Number.isNaN(ratingValue) ? 0 : ratingValue,
                rewatch: false,
              image: entry.title.posterPath
                ? `https://image.tmdb.org/t/p/w500${entry.title.posterPath}`
                : null,
              body: entry.body,
              liked: entry.liked,
              containsSpoilers: entry.containsSpoilers,
            };
          });
          setRecentEntries(mapped);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRecentError(loadError instanceof Error ? loadError.message : "Failed to load reviews.");
        }
      } finally {
        if (!cancelled) {
          setIsRecentLoading(false);
        }
      }
    };

    fetchRecent();

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function handleHydrate() {
    if (!selected) {
      setError("Select a title before logging.");
      return;
    }

    setIsHydrating(true);
    setError(null);
    try {
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

      const reviewResponse = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({
          tmdbId: selected.externalId,
          mediaType: selected.mediaType,
          watchedOn,
          rating: rating || undefined,
          containsSpoilers: false,
          liked,
          body: notes.trim() || "Review logged.",
          tags: [],
        }),
      });

      const diaryPayload = (await reviewResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!reviewResponse.ok || !diaryPayload.ok) {
        throw new Error(
          diaryPayload.ok ? "Review log failed." : diaryPayload.error?.message
        );
      }

      setSuccessMessage("Review logged.");
      setSelected(null);
      setQuery("");
      setResults([]);
      setRating(0);
      setLiked(false);
      setRewatch(false);
      setNotes("");
    } catch (hydrateError) {
      setError(
        hydrateError instanceof Error ? hydrateError.message : "Catalog hydrate failed."
      );
    } finally {
      setIsHydrating(false);
    }
  }

  const showResults = results.length > 0 && (!selected || trimmedQuery !== selected.title);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[var(--app-border)] bg-[var(--app-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--app-header-height)] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-2 transition-opacity hover:opacity-80" href="/">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-primary)] text-white">
                <span className="text-xs font-semibold">ML</span>
              </div>
              <span className="text-lg font-bold tracking-tight">MyFilmLists</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-6 md:flex">
              <a className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/">
                Home
              </a>
              <a className="text-sm font-medium text-white" href="/reviews">
                Reviews
              </a>
              <a className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/lists">
                Lists
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-col px-4 py-8 md:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
                Reviews
              </h1>
              <p className="text-base font-normal text-[var(--app-muted)]">
                Log the movies you have watched, rate them, and save them to your diary.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-lg">
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white">
                    What did you watch?
                  </span>
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
                      <option value="multi">All</option>
                      <option value="movie">Movies</option>
                      <option value="tv">TV</option>
                    </select>
                  </div>
                </label>
                {successMessage ? (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {successMessage}
                  </div>
                ) : null}
                <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-xs text-[var(--app-muted)]">
                  <div className="flex items-center justify-between">
                    <span>{resultLabel}</span>
                    {error ? <span className="text-red-300">{error}</span> : null}
                  </div>
                  {showResults ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {results.map((item) => {
                        const isSelected = selected?.externalId === item.externalId;
                        return (
                          <Button
                            key={`${item.source}-${item.externalId}-${item.mediaType}`}
                            variant="unstyled"
                            size="none"
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
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
                              className="h-12 w-9 shrink-0 rounded bg-cover bg-center"
                              style={{
                                backgroundImage: item.posterUrl
                                  ? `url('${item.posterUrl}')`
                                  : "none",
                              }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {item.title}
                              </p>
                              <p className="text-xs text-[var(--app-muted)]">
                                {item.mediaType.toUpperCase()}
                                {item.year ? ` · ${item.year}` : ""}
                              </p>
                            </div>
                          </Button>
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
                    <div className="flex items-center gap-3">
                      <div
                        className="h-14 w-10 shrink-0 rounded bg-cover bg-center"
                        style={{
                          backgroundImage: selected.posterUrl
                            ? `url('${selected.posterUrl}')`
                            : "var(--app-gradient-poster)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {selected.title}
                        </p>
                        <p className="text-xs text-[var(--app-muted)]">
                          {selected.mediaType.toUpperCase()}
                          {selected.year ? ` · ${selected.year}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--app-muted)] text-xs font-semibold uppercase">
                          Watched
                        </span>
                        <input
                          className="bg-transparent text-sm text-white focus:outline-none"
                          type="date"
                          value={watchedOn}
                          onChange={(event) => setWatchedOn(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
                        Rating
                      </span>
                      <div className="flex items-center gap-1 text-[var(--app-border-strong)]">
                        {[1, 2, 3, 4, 5].map((index) => (
                          <svg
                            key={index}
                            aria-hidden="true"
                            className={`h-4 w-4 transition-transform hover:scale-110 ${
                              rating >= index
                                ? "text-[var(--app-primary)]"
                                : "text-[var(--app-border-strong)]"
                            }`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            onClick={() => setRating(index)}
                          >
                            <path d="M12 2l2.9 6.4 7.1.7-5.3 4.7 1.6 6.8-6.3-3.6-6.3 3.6 1.6-6.8L2 9.1l7.1-.7L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="unstyled"
                      size="none"
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-[var(--app-border)] text-[var(--app-muted)] transition-colors hover:bg-pink-500/10 hover:text-pink-500 ${
                        liked ? "text-pink-400" : ""
                      }`}
                      onClick={() => setLiked((current) => !current)}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 21s-6.7-4.4-9.3-8.6C.7 8.6 2.4 4.8 6 4.8c2 0 3.4 1 4 2 0.6-1 2-2 4-2 3.6 0 5.3 3.8 3.3 7.6C18.7 16.6 12 21 12 21z" />
                      </svg>
                    </Button>
                    <Button
                      variant="unstyled"
                      size="none"
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        rewatch
                          ? "border-pink-500/60 text-pink-300"
                          : "border-[var(--app-border)] text-[var(--app-muted)]"
                      }`}
                      onClick={() => setRewatch((current) => !current)}
                      type="button"
                    >
                      Rewatch
                    </Button>
                  </div>
                  <Button
                    className="tracking-wide"
                    onClick={handleHydrate}
                    disabled={isHydrating || !selected}
                    type="button"
                  >
                    {isHydrating ? "Logging..." : "Log Film"}
                  </Button>
                  <ButtonLink variant="outline" href="/lists">
                    Add to list
                  </ButtonLink>
                </div>
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
                  {selected ? (
                    <span className="text-white">
                      Selected: {selected.title} ({selected.mediaType})
                    </span>
                  ) : (
                    <span>Select a title to hydrate it into the catalog.</span>
                  )}
                </div>
                <div className="mt-2">
                  <textarea
                    className="h-20 w-full resize-none rounded-lg border-none bg-[var(--app-border)] p-3 text-sm text-white placeholder-[var(--app-muted)]/70 focus:ring-1 focus:ring-[var(--app-primary)]"
                    placeholder="Add a review (optional)..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Recently Reviewed</h3>
                  <span className="text-xs text-[var(--app-muted)]">Latest 5</span>
                </div>
              {isRecentLoading ? (
                <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
                  Loading recent entries...
                </div>
              ) : recentError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {recentError}
                </div>
              ) : recentEntries.length === 0 ? (
                <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
                  No diary entries yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {recentEntries.map((movie) => (
                    <Link
                      key={movie.id}
                      className="group relative flex flex-col gap-2"
                      href={`/reviews/${encodeURIComponent(movie.id)}`}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[var(--app-border)] shadow-lg">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: movie.image
                              ? `url('${movie.image}')`
                              : "none",
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                        {movie.rewatch ? (
                          <div className="absolute right-2 top-2 rounded bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            REWATCH
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {movie.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--app-muted)]">
                          {movie.body}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <RatingStars rating={movie.rating} />
                          <span className="text-xs text-[var(--app-muted)]">{movie.date}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-full flex-col gap-6 lg:w-[340px]">
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-muted)]">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    {stat.isAverage ? (
                      <span className="text-sm text-[var(--app-muted)]">{stat.delta}</span>
                    ) : null}
                  </div>
                  {!stat.isAverage && stat.delta ? (
                    <div className="mt-1 flex items-center gap-0.5 text-xs font-bold text-[#0bda5b]">
                      <svg
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M4 14l6-6 4 4 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      <span>{stat.delta}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {isStatsLoading ? (
              <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-xs text-[var(--app-muted)]">
                Loading stats...
              </div>
            ) : null}
            {statsError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {statsError}
              </div>
            ) : null}

            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-5">
              <h3 className="mb-4 text-sm font-bold text-white">Top Genres</h3>
              <div className="flex flex-col gap-3">
                {genreStats.map((genre) => (
                  <div key={genre.label} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-medium text-[var(--app-muted)]">
                      {genre.label}
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--app-border)]">
                      <div className={`h-full rounded-full bg-[var(--app-primary)] ${genre.width}`} />
                    </div>
                    <div className="w-6 text-right text-xs font-bold text-white">
                      {genre.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
