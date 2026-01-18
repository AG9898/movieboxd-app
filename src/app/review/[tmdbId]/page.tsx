"use client";

import { Button } from "@/components/ui/Button";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

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

const tagOptions = ["sci-fi", "masterpiece"];

const ratingLabels = ["No rating", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"];

export default function ReviewPage() {
  const params = useParams();
  const tmdbIdParam = Array.isArray(params?.tmdbId) ? params.tmdbId[0] : params?.tmdbId;
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"movie" | "tv" | "multi">("movie");
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [selected, setSelected] = useState<CatalogResult | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(tagOptions);
  const [liked, setLiked] = useState(false);
  const [spoilers, setSpoilers] = useState(false);
  const [watchedOn, setWatchedOn] = useState("2023-10-27");
  const [adminPassphrase, setAdminPassphrase] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [missingTitle, setMissingTitle] = useState(false);
  const [isAutoHydrating, setIsAutoHydrating] = useState(false);
  const hasAttemptedAutoHydrate = useRef(false);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const ratingLabel = ratingLabels[rating] ?? "No rating";
  const resolvedMediaType = selected?.mediaType ?? "movie";

  const resultLabel = useMemo(() => {
    if (!canSearch) return "Type 2+ characters to search.";
    if (isSearching) return "Searching catalog...";
    if (results.length === 0) return "No results yet.";
    return `${results.length} results`;
  }, [canSearch, isSearching, results.length]);

  const showResults = results.length > 0 && (!selected || trimmedQuery !== selected.title);

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
    if (!tmdbIdParam || selected) return;
    const numericId = Number(tmdbIdParam);
    if (Number.isNaN(numericId)) return;

    let cancelled = false;
    const fetchTitle = async () => {
      setIsLoadingTitle(true);
      setMissingTitle(false);
      try {
        const response = await fetch(`/api/titles/${numericId}?mediaType=movie`);
        const payload = (await response.json()) as
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

        if (!response.ok || !payload.ok) {
          if (response.status === 404) {
            setMissingTitle(true);
          }
          throw new Error(payload.ok ? "Title not found." : payload.error?.message);
        }

        if (!cancelled) {
          const year = payload.data.releaseDate
            ? Number(payload.data.releaseDate.slice(0, 4))
            : null;
          setSelected({
            source: "tmdb",
            externalId: payload.data.tmdbId,
            mediaType: payload.data.mediaType,
            title: payload.data.title,
            year: Number.isNaN(year) ? null : year,
            overview: payload.data.overview ?? null,
            posterUrl: payload.data.posterPath
              ? `https://image.tmdb.org/t/p/w500${payload.data.posterPath}`
              : null,
            backdropUrl: null,
          });
        }
      } catch {
        if (!cancelled) {
          setSelected({
            source: "tmdb",
            externalId: numericId,
            mediaType: "movie",
            title: `TMDB #${numericId}`,
            year: null,
            overview: null,
            posterUrl: null,
            backdropUrl: null,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTitle(false);
        }
      }
    };

    fetchTitle();

    return () => {
      cancelled = true;
    };
  }, [selected, tmdbIdParam]);

  useEffect(() => {
    if (!selected) return;
    if (trimmedQuery === selected.title) {
      setResults([]);
    }
  }, [selected, trimmedQuery]);

  useEffect(() => {
    if (!tmdbIdParam || !missingTitle) return;
    if (!adminPassphrase) return;
    if (isAutoHydrating || hasAttemptedAutoHydrate.current) return;
    const numericId = Number(tmdbIdParam);
    if (Number.isNaN(numericId)) return;

    let cancelled = false;
    const hydrate = async () => {
      setIsAutoHydrating(true);
      setError(null);
      try {
        const hydrateResponse = await fetch("/api/catalog/hydrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-passphrase": adminPassphrase,
          },
          body: JSON.stringify({
            source: "tmdb",
            externalId: numericId,
            mediaType: "movie",
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

        const titleResponse = await fetch(`/api/titles/${numericId}?mediaType=movie`);
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
          throw new Error(
            titlePayload.ok ? "Title not found." : titlePayload.error?.message
          );
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
          setMissingTitle(false);
          hasAttemptedAutoHydrate.current = true;
        }
      } catch (hydrateError) {
        if (!cancelled) {
          setError(
            hydrateError instanceof Error ? hydrateError.message : "Catalog hydrate failed."
          );
        }
      } finally {
        if (!cancelled) {
          setIsAutoHydrating(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [adminPassphrase, isAutoHydrating, missingTitle, tmdbIdParam]);

  useEffect(() => {
    if (!successMessage) return;
    const handle = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(handle);
  }, [successMessage]);

  function addTag(value: string) {
    const next = value.trim().toLowerCase();
    if (!next || tags.includes(next)) return;
    setTags((current) => [...current, next]);
  }

  function removeTag(value: string) {
    setTags((current) => current.filter((tag) => tag !== value));
  }

  async function handleSaveReview() {
    if (!selected) {
      setError("Select a film before saving.");
      return;
    }
    if (!reviewText.trim()) {
      setError("Review text is required.");
      return;
    }

    setIsSaving(true);
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
          watchedOn: watchedOn || undefined,
          rating: rating || undefined,
          containsSpoilers: spoilers,
          liked,
          body: reviewText.trim(),
          tags,
        }),
      });

      const reviewPayload = (await reviewResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!reviewResponse.ok || !reviewPayload.ok) {
        throw new Error(
          reviewPayload.ok ? "Review creation failed." : reviewPayload.error?.message
        );
      }

      setSuccessMessage("Review saved.");
      setReviewText("");
      setTags(tagOptions);
      setRating(0);
      setLiked(false);
      setSpoilers(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-panel)] text-white">
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

      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-[1024px] flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              I have watched...
            </h1>
            <p className="text-sm font-normal text-[var(--app-muted)]">
              Tell us what you thought of this film.
            </p>
          </div>
          {successMessage ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px]">
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
                <div
                  className="mb-4 aspect-[2/3] w-full overflow-hidden rounded-lg bg-cover bg-center shadow-md"
                  style={{
                    backgroundImage:
                      selected?.posterUrl
                        ? `url('${selected.posterUrl}')`
                        : "var(--app-gradient-poster)",
                  }}
                />
                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-xl font-bold leading-tight text-white">
                    {isLoadingTitle ? "Loading..." : selected?.title ?? "Select a film"}
                  </h2>
                  <p className="text-sm text-[var(--app-muted)]">
                    {selected?.year ? `${selected.year} • ` : ""}
                    {resolvedMediaType === "tv" ? "Series" : "Film"} details pending
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-xs text-[var(--app-muted)]">
                <div className="flex items-center justify-between">
                  <span>{resultLabel}</span>
                  {error ? <span className="text-red-300">{error}</span> : null}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="w-full rounded-md border border-[#2c3b59] bg-[var(--app-panel)] px-3 py-2 text-xs text-white placeholder-[#5a6b8c] focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]"
                    placeholder="Search for a film..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#5a6b8c]">
                    Type
                  </span>
                  <select
                    className="rounded-md bg-[var(--app-border)] px-2 py-1 text-xs text-white"
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
                {showResults ? (
                  <div className="mt-3 grid gap-2">
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
                              : "border-transparent bg-[#1a2638] text-slate-200 hover:border-[#2c3b59]"
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
                              {item.year ? ` • ${item.year}` : ""}
                            </p>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : null}
                {!isSearching && canSearch && results.length === 0 && !error ? (
                  <div className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-xs text-[var(--app-muted)]">
                    No results found. Try another title or adjust the type filter.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">
                    Date Watched
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <input
                      className="block w-full rounded-lg border-none bg-[var(--app-border)] py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--app-primary)]"
                      type="date"
                      value={watchedOn}
                      onChange={(event) => setWatchedOn(event.target.value)}
                    />
                  </div>
                </div>
                <div className="h-px bg-[#2c3b59] my-1" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--app-muted)] transition-colors group-hover:text-pink-500">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 21s-6.7-4.4-9.3-8.6C.7 8.6 2.4 4.8 6 4.8c2 0 3.4 1 4 2 0.6-1 2-2 4-2 3.6 0 5.3 3.8 3.3 7.6C18.7 16.6 12 21 12 21z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-200">Like this film</span>
                  </div>
                  <label className="relative flex h-[24px] w-[44px] cursor-pointer items-center rounded-full bg-[var(--app-border)] p-0.5 transition-colors">
                    <div
                      className={`h-full w-[20px] rounded-full bg-white shadow-sm transition-transform ${
                        liked ? "translate-x-[20px]" : ""
                      }`}
                    />
                    <input
                      className="invisible absolute"
                      type="checkbox"
                      checked={liked}
                      onChange={(event) => setLiked(event.target.checked)}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--app-muted)] transition-colors group-hover:text-amber-500">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 6a7 7 0 017 7H5a7 7 0 017-7zm0-4a11 11 0 0111 11v4a1 1 0 01-1 1H2a1 1 0 01-1-1v-4A11 11 0 0112 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-200">
                      Contains spoilers
                    </span>
                  </div>
                  <label className="relative flex h-[24px] w-[44px] cursor-pointer items-center rounded-full bg-[var(--app-border)] p-0.5 transition-colors">
                    <div
                      className={`h-full w-[20px] rounded-full bg-white shadow-sm transition-transform ${
                        spoilers ? "translate-x-[20px]" : ""
                      }`}
                    />
                    <input
                      className="invisible absolute"
                      type="checkbox"
                      checked={spoilers}
                      onChange={(event) => setSpoilers(event.target.checked)}
                    />
                  </label>
                </div>
                <details className="rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-2 text-xs text-[var(--app-muted)]">
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
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-6">
              <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Rate this film
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="unstyled"
                      size="none"
                      className={`p-1 transition-colors focus:outline-none ${
                        rating >= star ? "text-[var(--app-primary)]" : "text-[#2c3b59]"
                      } hover:text-[var(--app-primary)]`}
                      onClick={() => setRating(star)}
                      type="button"
                    >
                      <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.9 6.4 7.1.7-5.3 4.7 1.6 6.8-6.3-3.6-6.3 3.6 1.6-6.8L2 9.1l7.1-.7L12 2z" />
                      </svg>
                    </Button>
                  ))}
                  <span className="ml-4 text-sm font-medium text-[#5a6b8c]">
                    {ratingLabel}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[400px] flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
                <div className="flex-1 p-4">
                  <textarea
                    className="h-full w-full resize-none border-none bg-transparent text-base leading-relaxed text-slate-100 placeholder:text-slate-600 focus:ring-0"
                    placeholder="Express your thoughts on the film... What stood out? How was the acting, direction, or story?"
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                  />
                </div>
                <div className="border-t border-[var(--app-border)] p-4">
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#2c3b59] bg-[var(--app-panel)] p-2 focus-within:ring-1 focus-within:ring-[var(--app-primary)]">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 rounded bg-[var(--app-primary)]/20 px-2 py-1 text-xs font-medium text-[var(--app-primary)]"
                      >
                        {tag}
                        <Button
                          variant="unstyled"
                          size="none"
                          className="text-[var(--app-primary)]/70"
                          onClick={() => removeTag(tag)}
                          type="button"
                        >
                          x
                        </Button>
                      </div>
                    ))}
                    <input
                      className="min-w-[120px] flex-1 border-none bg-transparent p-1 text-sm text-white placeholder:text-[#5a6b8c] focus:ring-0"
                      placeholder="Add tags..."
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag(tagInput);
                          setTagInput("");
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pb-8">
                <Button variant="ghost">
                  Cancel
                </Button>
                <Button
                  size="lg"
                  className="px-8"
                  onClick={handleSaveReview}
                  disabled={!selected || isSaving}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {isSaving ? "Saving..." : "Save Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
