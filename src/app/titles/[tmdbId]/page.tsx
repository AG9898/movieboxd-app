"use client";

import { ButtonLink } from "@/components/ui/Button";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TitleDetails = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string | null;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  runtimeMinutes: number | null;
  genres: string[];
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message?: string } };

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TitleDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tmdbIdParam = Array.isArray(params?.tmdbId) ? params.tmdbId[0] : params?.tmdbId;
  const mediaType = (searchParams.get("mediaType") ?? "movie") as "movie" | "tv";

  const [title, setTitle] = useState<TitleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbIdParam) return;
    const numericId = Number(tmdbIdParam);
    if (Number.isNaN(numericId)) {
      setError("Invalid title id.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchTitle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/titles/${numericId}?mediaType=${mediaType}`);
        const payload = (await response.json()) as ApiResponse<TitleDetails>;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Title not found." : payload.error?.message);
        }
        if (!cancelled) {
          setTitle(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Title not found.");
          setTitle(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTitle();

    return () => {
      cancelled = true;
    };
  }, [mediaType, tmdbIdParam]);

  const releaseYear = useMemo(() => {
    if (!title?.releaseDate) return null;
    const year = Number(title.releaseDate.slice(0, 4));
    return Number.isNaN(year) ? null : year;
  }, [title?.releaseDate]);

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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Title details</h1>
            <p className="text-sm text-[var(--app-muted)]">
              {title ? "Hydrated title information." : "View metadata for hydrated titles."}
            </p>
          </div>
          {title ? (
            <ButtonLink href={`/review/${title.tmdbId}`} size="sm">
              Write a review
            </ButtonLink>
          ) : null}
        </section>

        {isLoading ? (
          <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-muted)]">
            Loading title details...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && title ? (
          <div className="flex flex-col gap-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm lg:flex-row">
            <div
              className="h-64 w-44 shrink-0 rounded-xl bg-cover bg-center"
              style={{
                backgroundImage: title.posterPath
                  ? `url('https://image.tmdb.org/t/p/w500${title.posterPath}')`
                  : "var(--app-gradient-poster)",
              }}
            />
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{title.title}</h2>
                <p className="text-sm text-[var(--app-muted)]">
                  {releaseYear ? `${releaseYear} • ` : ""}
                  {title.mediaType.toUpperCase()}
                  {title.runtimeMinutes ? ` • ${title.runtimeMinutes} min` : ""}
                </p>
                {title.originalTitle && title.originalTitle !== title.title ? (
                  <p className="text-xs text-[var(--app-muted)]">Original title: {title.originalTitle}</p>
                ) : null}
              </div>

              {title.genres.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {title.genres.map((genre) => (
                    <span
                      key={`${title.id}-${genre}`}
                      className="rounded-full border border-[#2c3b59] px-3 py-1 text-xs text-[var(--app-muted)]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="text-sm text-[#d7dde8]">
                {title.overview ? title.overview : "No synopsis available."}
              </div>

              <div className="grid gap-2 text-xs text-[var(--app-muted)]">
                <div>
                  Release date: {title.releaseDate ? formatDate(title.releaseDate) : "Unknown"}
                </div>
                <div>TMDB ID: {title.tmdbId}</div>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && !title ? (
          <div className="rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-8 text-center text-sm text-[var(--app-muted)]">
            Title not found. Hydrate it from Reviews or Rate & Review first.
          </div>
        ) : null}
      </main>
    </div>
  );
}
