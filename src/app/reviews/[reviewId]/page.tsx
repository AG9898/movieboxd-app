"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ReviewDetail = {
  id: string;
  title: {
    tmdbId: number;
    mediaType: "movie" | "tv";
    title: string;
    releaseDate: string | null;
    posterPath: string | null;
    backdropPath: string | null;
  };
  watchedOn: string | null;
  rating: number | null;
  containsSpoilers: boolean;
  liked: boolean;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
    month: "short",
    day: "numeric",
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-[var(--app-primary)]">
      {[1, 2, 3, 4, 5].map((index) => (
        <svg
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 ${rating >= index ? "" : "opacity-30"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l2.9 6.4 7.1.7-5.3 4.7 1.6 6.8-6.3-3.6-6.3 3.6 1.6-6.8L2 9.1l7.1-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Array.isArray(params?.reviewId) ? params.reviewId[0] : params?.reviewId;
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!reviewId || reviewId === "undefined" || reviewId === "null") {
      setError("Review not found.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const fetchReview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reviews/${reviewId}`);
        const payload = (await response.json()) as ApiResponse<ReviewDetail>;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load review." : payload.error?.message);
        }
        if (!cancelled) {
          setReview(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load review.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchReview();

    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  const releaseYear = useMemo(() => {
    if (!review?.title.releaseDate) return null;
    const year = Number(review.title.releaseDate.slice(0, 4));
    return Number.isNaN(year) ? null : year;
  }, [review?.title.releaseDate]);

  const posterUrl = review?.title.posterPath
    ? `https://image.tmdb.org/t/p/w500${review.title.posterPath}`
    : null;

  const handleDelete = async () => {
    if (!reviewId || typeof reviewId !== "string") return;
    const confirmed = window.confirm("Delete this review? This cannot be undone.");
    if (!confirmed) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ ok?: boolean }>;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Failed to delete review." : payload.error?.message);
      }
      router.push("/my-reviews");
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error ? deleteFailure.message : "Failed to delete review."
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Review Details</h1>
            <p className="text-sm text-[var(--app-muted)]">
              {review ? "Full review entry and details." : "Loading review details."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-red-500/40 text-red-200 hover:border-red-400 hover:text-red-100"
              disabled={!review || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete review"}
            </Button>
            <ButtonLink variant="outline" href="/reviews">
              Back to reviews
            </ButtonLink>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
            Loading review...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {deleteError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {deleteError}
          </div>
        ) : null}

        {review ? (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4">
              <div
                className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-cover bg-center"
                style={{
                  backgroundImage: posterUrl ? `url('${posterUrl}')` : "var(--app-gradient-poster)",
                }}
              />
              <div className="mt-4 text-center">
                <h2 className="text-lg font-bold text-white">{review.title.title}</h2>
                <p className="text-sm text-[var(--app-muted)]">
                  {releaseYear ? `${releaseYear} · ` : ""}
                  {review.title.mediaType === "tv" ? "Series" : "Film"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-6">
              <div className="flex flex-wrap items-center gap-3">
                {review.rating !== null ? <RatingStars rating={review.rating} /> : null}
                {review.liked ? (
                  <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-semibold text-pink-300">
                    Liked
                  </span>
                ) : null}
                {review.containsSpoilers ? (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                    Spoilers
                  </span>
                ) : null}
                <span className="text-xs text-[var(--app-muted)]">
                  Watched {formatDate(review.watchedOn || review.createdAt)}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                <p className="text-sm leading-relaxed text-slate-100">{review.body}</p>
              </div>

              {review.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-1 text-xs text-[var(--app-muted)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
