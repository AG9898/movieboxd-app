"use client";

import AuthNav from "@/components/auth/AuthNav";
import { useRequireSession } from "@/components/auth/useRequireSession";
import AddToListButton from "@/components/lists/AddToListButton";
import { Button } from "@/components/ui/Button";
import { type MediaType, toMediaType } from "@/types/media";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";

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
  mediaType: MediaType;
  date: string;
  rating: number;
  image: string | null;
  body: string;
  liked: boolean;
  containsSpoilers: boolean;
};

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
  const { isLoading: isSessionLoading } = useRequireSession();
  const [queryParams, setQueryParams] = useState<URLSearchParams | null>(null);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "tv" | "multi">("multi");
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [selected, setSelected] = useState<CatalogResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isAutoHydrating, setIsAutoHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [notes, setNotes] = useState("");
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setQueryParams(new URLSearchParams(window.location.search));
  }, []);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const preselectTmdbId = queryParams?.get("tmdbId") ?? null;
  const preselectMediaType = (queryParams?.get("mediaType") ?? "movie") as "movie" | "tv";
  const shouldAutoHydrate = queryParams?.get("autoHydrate") === "1";

  const resultLabel = useMemo(() => {
    if (!canSearch) return "Type 2+ characters to search.";
    if (isSearching) return "Searching catalog...";
    if (results.length === 0) return "No results yet.";
    return `${results.length} results`;
  }, [canSearch, isSearching, results.length]);

  const handleRatingKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setRating((current) => Math.max(0, Number((current - 0.5).toFixed(1))));
    }
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setRating((current) => Math.min(5, Number((current + 0.5).toFixed(1))));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setRating(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setRating(5);
    }
  };

  useEffect(() => {
    if (!preselectTmdbId || selected) return;
    const numericId = Number(preselectTmdbId);
    if (Number.isNaN(numericId)) return;
    let cancelled = false;

    const hydrateAndSelect = async () => {
      setIsAutoHydrating(true);
      setError(null);
      try {
        if (shouldAutoHydrate) {
          try {
            const hydrateResponse = await fetch("/api/catalog/hydrate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                source: "tmdb",
                externalId: numericId,
                mediaType: preselectMediaType,
              }),
            });
            const hydratePayload = (await hydrateResponse.json()) as
              | { ok: true }
              | { ok: false; error: { message?: string } };

            if (!hydrateResponse.ok || !hydratePayload.ok) {
              // Allow selection even if hydration fails.
            }
          } catch {
            // Ignore hydrate failures; title lookup can still use TMDB fallback.
          }
        }

        const titleResponse = await fetch(
          `/api/titles/${numericId}?mediaType=${preselectMediaType}`
        );
        const titlePayload = (await titleResponse.json()) as
          | {
              ok: true;
              data: {
                tmdbId: number;
                mediaType: "movie" | "tv";
                title: string;
                releaseDate: string | null;
                posterPath: string | null;
                overview: string | null;
              };
            }
          | { ok: false; error: { message?: string } };

        if (!titleResponse.ok || !titlePayload.ok) {
          throw new Error(titlePayload.ok ? "Title not found." : titlePayload.error?.message);
        }

        if (!cancelled) {
          const year = titlePayload.data.releaseDate
            ? Number(titlePayload.data.releaseDate.slice(0, 4))
            : null;
          setSelected({
            source: "tmdb",
            externalId: titlePayload.data.tmdbId,
            mediaType: titlePayload.data.mediaType,
            title: titlePayload.data.title,
            year: Number.isNaN(year) ? null : year,
            overview: titlePayload.data.overview ?? null,
            posterUrl: titlePayload.data.posterPath
              ? `https://image.tmdb.org/t/p/w500${titlePayload.data.posterPath}`
              : null,
            backdropUrl: null,
          });
          setQuery(titlePayload.data.title);
          setResults([]);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Catalog hydrate failed.");
        }
      } finally {
        if (!cancelled) {
          setIsAutoHydrating(false);
        }
      }
    };

    hydrateAndSelect();

    return () => {
      cancelled = true;
    };
  }, [preselectMediaType, preselectTmdbId, selected, shouldAutoHydrate]);

  useEffect(() => {
    if (!successMessage) return;
    const handle = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(handle);
  }, [successMessage]);

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
              const mediaType = toMediaType(entry.title.mediaType);
              if (!mediaType) return null;
              const ratingValue = entry.rating ?? 0;
              const dateValue = entry.watchedOn ?? entry.createdAt;
              return {
                id: entry.id,
                title: entry.title.title,
                tmdbId: entry.title.tmdbId,
                mediaType,
                date: new Date(dateValue).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                }),
                rating: Number.isNaN(ratingValue) ? 0 : ratingValue,
                image: entry.title.posterPath
                  ? `https://image.tmdb.org/t/p/w500${entry.title.posterPath}`
                  : null,
                body: entry.body,
                liked: entry.liked,
                containsSpoilers: entry.containsSpoilers,
              };
            })
            .filter((entry): entry is RecentEntry => entry !== null);
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
        },
        body: JSON.stringify({
          tmdbId: selected.externalId,
          mediaType: selected.mediaType,
          rating: rating || undefined,
          containsSpoilers: false,
          liked,
          body: notes.trim() || "Review logged.",
          tags: [],
        }),
      });

      const reviewPayload = (await reviewResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!reviewResponse.ok || !reviewPayload.ok) {
        throw new Error(
          reviewPayload.ok ? "Review log failed." : reviewPayload.error?.message
        );
      }

      setSuccessMessage("Review logged.");
      setSelected(null);
      setQuery("");
      setResults([]);
      setRating(0);
      setLiked(false);
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
              <Link className="text-sm font-medium text-white" href="/reviews">
                Reviews
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/my-reviews">
                My Reviews
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/to-watch">
                To Watch
              </Link>
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/lists">
                Lists
              </Link>
              <AuthNav />
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1280px] flex-col px-4 py-8 md:px-8 lg:px-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">Reviews</h1>
            <p className="text-base font-normal text-[var(--app-muted)]">
              Log the movies you have watched, rate them, and publish quick reviews.
            </p>
          </div>

          {successMessage ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex w-full flex-col gap-6 lg:w-[320px]">
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-lg">
                <div
                  className="mb-4 aspect-[2/3] w-full overflow-hidden rounded-lg bg-cover bg-center shadow-md"
                  style={{
                    backgroundImage: selected?.posterUrl
                      ? `url('${selected.posterUrl}')`
                      : "var(--app-gradient-poster)",
                  }}
                />
                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-xl font-bold text-white">
                    {selected?.title ?? "Select a film"}
                  </h2>
                  <p className="text-sm text-[var(--app-muted)]">
                    {selected?.year ? `${selected.year} - ` : ""}
                    {selected?.mediaType === "tv" ? "Series" : "Film"}
                  </p>
                </div>
                {isAutoHydrating ? (
                  <div className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-muted)]">
                    Hydrating title...
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-6">
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-lg">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white">What did you watch?</span>
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
                <div className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-xs text-[var(--app-muted)]">
                  <div className="flex items-center justify-between">
                    <span>{resultLabel}</span>
                    {error ? <span className="text-red-300">{error}</span> : null}
                  </div>
                  {showResults ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                {item.year ? ` - ${item.year}` : ""}
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
              </div>

              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
                        Rating
                      </span>
                      <div
                        className="flex items-center gap-1 text-[var(--app-border-strong)]"
                        role="slider"
                        aria-label="Rating"
                        aria-valuemin={0}
                        aria-valuemax={5}
                        aria-valuenow={rating}
                        aria-valuetext={`${rating || 0} stars`}
                        tabIndex={0}
                        onKeyDown={handleRatingKeyDown}
                      >
                        {[1, 2, 3, 4, 5].map((index) => {
                          const diff = rating - index;
                          const isFull = diff >= 0;
                          const isHalf = diff >= -0.5 && diff < 0;
                          const opacity = isFull ? "opacity-100" : isHalf ? "opacity-60" : "opacity-30";
                          return (
                            <div key={index} className="relative">
                              <svg
                                aria-hidden="true"
                                className={`h-5 w-5 transition-transform hover:scale-110 text-[var(--app-primary)] ${opacity}`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2l2.9 6.4 7.1.7-5.3 4.7 1.6 6.8-6.3-3.6-6.3 3.6 1.6-6.8L2 9.1l7.1-.7L12 2z" />
                              </svg>
                              <button
                                aria-label={`Rate ${index - 0.5} stars`}
                                className="absolute inset-y-0 left-0 w-1/2"
                                onClick={() => setRating(index - 0.5)}
                                type="button"
                              />
                              <button
                                aria-label={`Rate ${index} stars`}
                                className="absolute inset-y-0 right-0 w-1/2"
                                onClick={() => setRating(index)}
                                type="button"
                              />
                            </div>
                          );
                        })}
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
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      className="tracking-wide"
                      onClick={handleHydrate}
                      disabled={isHydrating || !selected}
                      type="button"
                    >
                      {isHydrating ? "Reviewing..." : "Review Film"}
                    </Button>
                    <AddToListButton
                      tmdbId={selected?.externalId ?? null}
                      mediaType={selected?.mediaType ?? "movie"}
                      source={selected?.source ?? "tmdb"}
                      variant="outline"
                      size="md"
                      disabled={!selected}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-xs text-[var(--app-muted)]">
                  {selected ? (
                    <span className="text-white">
                      Selected: {selected.title} ({selected.mediaType})
                    </span>
                  ) : (
                    <span>Select a title to hydrate it into the catalog.</span>
                  )}
                </div>
                <div className="mt-4">
                  <textarea
                    className="h-36 w-full resize-none rounded-lg border-none bg-[var(--app-border)] p-3 text-sm text-white placeholder-[var(--app-muted)]/70 focus:ring-1 focus:ring-[var(--app-primary)]"
                    placeholder="Add a review (optional)..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Recently Reviewed</h3>
                  <span className="text-xs text-[var(--app-muted)]">Latest 5</span>
                </div>
                {isRecentLoading ? (
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
                    Loading recent reviews...
                  </div>
                ) : recentError ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {recentError}
                  </div>
                ) : recentEntries.length === 0 ? (
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
                    No reviews yet.
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
                              backgroundImage: movie.image ? `url('${movie.image}')` : "none",
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
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
          </div>
        </div>
      </main>
    </div>
  );
}
