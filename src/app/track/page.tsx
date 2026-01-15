"use client";

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

const stats = [
  { label: "Total", value: "1,240", delta: "+2%" },
  { label: "This Year", value: "42", delta: "+5%" },
  { label: "This Month", value: "12", delta: "+10%" },
  { label: "Avg Rating", value: "3.8", delta: "/ 5", isAverage: true },
];

type DiaryEntryResponse = {
  id: string;
  watchedOn: string;
  rating: number | string | null;
  liked: boolean;
  rewatch: boolean;
  title: {
    title: string;
    posterPath: string | null;
  };
};

type RecentEntry = {
  id: string;
  title: string;
  date: string;
  rating: number;
  rewatch: boolean;
  image: string | null;
};

const genreStats = [
  { label: "Sci-Fi", value: 28, width: "w-[75%]" },
  { label: "Drama", value: 15, width: "w-[50%]" },
  { label: "Action", value: 8, width: "w-[30%]" },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex text-[#0d8bf2] text-[10px] gap-0.5">
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

export default function TrackFilmsPage() {
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
  const [recentScope, setRecentScope] = useState<"month" | "all">("all");

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
    const fetchRecent = async () => {
      setIsRecentLoading(true);
      setRecentError(null);
      try {
        const url = new URL("/api/diary", window.location.origin);
        url.searchParams.set("limit", "12");
        if (recentScope === "month") {
          const now = new Date();
          url.searchParams.set("month", String(now.getMonth() + 1));
          url.searchParams.set("year", String(now.getFullYear()));
        }
        const response = await fetch(url.toString());
        const payload = (await response.json()) as
          | { ok: true; data: DiaryEntryResponse[] }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load diary." : payload.error?.message);
        }

        if (!cancelled) {
          const mapped = payload.data.map((entry) => {
            const ratingValue =
              entry.rating === null
                ? 0
                : typeof entry.rating === "string"
                ? Number(entry.rating)
                : entry.rating;
            return {
              id: entry.id,
              title: entry.title.title,
              date: new Date(entry.watchedOn).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              }),
              rating: Number.isNaN(ratingValue) ? 0 : ratingValue,
              rewatch: entry.rewatch,
              image: entry.title.posterPath
                ? `https://image.tmdb.org/t/p/w500${entry.title.posterPath}`
                : null,
            };
          });
          setRecentEntries(mapped);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRecentError(loadError instanceof Error ? loadError.message : "Failed to load diary.");
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
  }, [recentScope]);

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

      const diaryResponse = await fetch("/api/diary/log", {
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
          liked,
          rewatch,
          notes: notes.trim() || undefined,
        }),
      });

      const diaryPayload = (await diaryResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!diaryResponse.ok || !diaryPayload.ok) {
        throw new Error(
          diaryPayload.ok ? "Diary log failed." : diaryPayload.error?.message
        );
      }

      setSuccessMessage("Film logged.");
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

  return (
    <div className="min-h-screen bg-[#101a22] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#223749] bg-[#101a23]/95 px-4 py-3 backdrop-blur-md sm:px-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d8bf2] text-white">
              <span className="text-xs font-semibold">FT</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
              FilmTrack
            </h2>
          </div>
        </div>
        <div className="flex flex-1 justify-end" />
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-col px-4 py-8 md:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
                Track Films
              </h1>
              <p className="text-base font-normal text-[#90b0cb]">
                Log the movies you have watched, rate them, and save them to your diary.
              </p>
            </div>

            <div className="rounded-xl border border-[#223749] bg-[#1c2a35] p-6 shadow-lg">
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white">
                    What did you watch?
                  </span>
                  <div className="flex w-full items-center gap-3 rounded-lg bg-[#223749] focus-within:ring-2 focus-within:ring-[#0d8bf2]/50">
                    <input
                      className="w-full border-none bg-transparent px-4 py-3 text-base text-white placeholder-[#90b0cb] focus:ring-0"
                      placeholder="Search for a film title..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <select
                      className="mr-3 rounded-md bg-[#2c445a] px-2 py-1 text-xs text-white"
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
                <div className="rounded-lg border border-[#223749] bg-[#16212b] p-3 text-xs text-[#90b0cb]">
                  <div className="flex items-center justify-between">
                    <span>{resultLabel}</span>
                    {error ? <span className="text-red-300">{error}</span> : null}
                  </div>
                  {results.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {results.map((item) => {
                        const isSelected = selected?.externalId === item.externalId;
                        return (
                          <button
                          key={`${item.source}-${item.externalId}-${item.mediaType}`}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                              isSelected
                                ? "border-[#0d8bf2] bg-[#223749] text-white"
                                : "border-transparent bg-[#1c2a35] text-slate-200 hover:border-[#2c445a]"
                            }`}
                            onClick={() => setSelected(item)}
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
                              <p className="text-xs text-[#90b0cb]">
                                {item.mediaType.toUpperCase()}
                                {item.year ? ` · ${item.year}` : ""}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 rounded-lg bg-[#223749] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2c445a]">
                      <span className="text-[#90b0cb]">Date</span>
                      <input
                        className="bg-transparent text-sm text-white focus:outline-none"
                        type="date"
                        value={watchedOn}
                        onChange={(event) => setWatchedOn(event.target.value)}
                      />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#90b0cb]">
                        Rating
                      </span>
                      <div className="flex items-center gap-1 text-[#2c445a]">
                        {[1, 2, 3, 4, 5].map((index) => (
                          <svg
                            key={index}
                            aria-hidden="true"
                            className={`h-4 w-4 transition-transform hover:scale-110 ${
                              rating >= index ? "text-[#0d8bf2]" : "text-[#2c445a]"
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
                    <button
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#223749] text-[#90b0cb] transition-colors hover:bg-pink-500/10 hover:text-pink-500 ${
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
                    </button>
                    <button
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        rewatch
                          ? "border-pink-500/60 text-pink-300"
                          : "border-[#223749] text-[#90b0cb]"
                      }`}
                      onClick={() => setRewatch((current) => !current)}
                      type="button"
                    >
                      Rewatch
                    </button>
                  </div>
                  <button
                    className="rounded-lg bg-[#0d8bf2] px-6 py-2.5 text-sm font-bold tracking-wide text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleHydrate}
                    disabled={isHydrating || !selected}
                    type="button"
                  >
                    {isHydrating ? "Logging..." : "Log Film"}
                  </button>
                </div>
                <div className="flex flex-col gap-2 text-xs text-[#90b0cb]">
                  <details className="rounded-lg border border-[#223749] bg-[#1c2a35] px-3 py-2">
                    <summary className="cursor-pointer text-sm font-semibold text-white">
                      Admin passphrase (only if writes are locked)
                    </summary>
                    <div className="mt-2">
                      <input
                        className="w-full rounded-lg border border-[#223749] bg-[#223749] px-3 py-2 text-sm text-white placeholder-[#90b0cb]"
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
                    className="h-20 w-full resize-none rounded-lg border-none bg-[#223749] p-3 text-sm text-white placeholder-[#90b0cb]/70 focus:ring-1 focus:ring-[#0d8bf2]"
                    placeholder="Add a review (optional)..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Recently Watched</h3>
                  <div className="flex gap-2">
                    <button
                      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
                        recentScope === "month"
                          ? "bg-[#223749] text-white"
                          : "text-[#90b0cb] hover:bg-[#223749] hover:text-white"
                      }`}
                      onClick={() => setRecentScope("month")}
                      type="button"
                    >
                      This Month
                    </button>
                    <button
                      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
                        recentScope === "all"
                          ? "bg-[#223749] text-white"
                          : "text-[#90b0cb] hover:bg-[#223749] hover:text-white"
                      }`}
                      onClick={() => setRecentScope("all")}
                      type="button"
                    >
                      All Time
                    </button>
                  </div>
                </div>
              {isRecentLoading ? (
                <div className="rounded-lg border border-[#223749] bg-[#1c2a35] px-4 py-3 text-sm text-[#90b0cb]">
                  Loading recent entries...
                </div>
              ) : recentError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {recentError}
                </div>
              ) : recentEntries.length === 0 ? (
                <div className="rounded-lg border border-[#223749] bg-[#1c2a35] px-4 py-3 text-sm text-[#90b0cb]">
                  No diary entries yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {recentEntries.map((movie) => (
                    <div key={movie.id} className="group relative flex flex-col gap-2">
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#223749] shadow-lg">
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
                        <div className="mt-0.5 flex items-center justify-between">
                          <RatingStars rating={movie.rating} />
                          <span className="text-xs text-[#90b0cb]">{movie.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-full flex-col gap-6 lg:w-[340px]">
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 rounded-lg border border-[#223749] bg-[#1c2a35] p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-[#90b0cb]">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    {stat.isAverage ? (
                      <span className="text-sm text-[#90b0cb]">{stat.delta}</span>
                    ) : null}
                  </div>
                  {!stat.isAverage ? (
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

            <div className="overflow-hidden rounded-xl border border-[#223749] bg-[#1c2a35]">
              <div className="flex items-center justify-between border-b border-[#223749] p-4">
                <h3 className="text-sm font-bold text-white">Diary Activity</h3>
                <button className="text-xs font-bold uppercase text-[#0d8bf2] hover:underline">
                  View Full
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <button className="rounded-full p-1 text-[#90b0cb] transition-colors hover:bg-[#223749] hover:text-white">
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                  <p className="text-sm font-bold text-white">October 2023</p>
                  <button className="rounded-full p-1 text-[#90b0cb] transition-colors hover:bg-[#223749] hover:text-white">
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold text-[#90b0cb]">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <p key={`${day}-${index}`}>{day}</p>
                  ))}
                  {[...Array(30)].map((_, index) => {
                    const day = index + 1;
                    const isActive = [5, 12, 18, 20, 24].includes(day);
                    return (
                      <div
                        key={day}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                          isActive
                            ? "bg-[#0d8bf2] font-bold text-white shadow-lg shadow-blue-500/30"
                            : "text-[#90b0cb] hover:bg-[#223749]"
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#223749] bg-[#1c2a35] p-5">
              <h3 className="mb-4 text-sm font-bold text-white">Top Genres</h3>
              <div className="flex flex-col gap-3">
                {genreStats.map((genre) => (
                  <div key={genre.label} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-medium text-[#90b0cb]">
                      {genre.label}
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#223749]">
                      <div className={`h-full rounded-full bg-[#0d8bf2] ${genre.width}`} />
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
