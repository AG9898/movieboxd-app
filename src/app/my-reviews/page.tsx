"use client";

import AuthNav from "@/components/auth/AuthNav";
import { useRequireSession } from "@/components/auth/useRequireSession";
import AddToListButton from "@/components/lists/AddToListButton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

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

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message?: string } };

function formatDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-[var(--app-primary)]">
      {[1, 2, 3, 4, 5].map((index) => {
        const diff = rating - index;
        const isFull = diff >= 0;
        const isHalf = diff >= -0.5 && diff < 0;
        const opacity = isFull ? "opacity-100" : isHalf ? "opacity-60" : "opacity-30";
        return (
          <svg
            key={index}
            aria-hidden="true"
            className={`h-4 w-4 ${opacity}`}
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

export default function MyReviewsPage() {
  const { isLoading: isSessionLoading } = useRequireSession();
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/reviews?limit=50");
        const payload = (await response.json()) as ApiResponse<ReviewSummary[]>;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load reviews." : payload.error?.message);
        }
        if (!cancelled) {
          setReviews(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load reviews.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleEdit = () => {
    setIsEditing((current) => {
      const next = !current;
      if (!next) {
        setSelectedIds(new Set());
      }
      return next;
    });
    setShowDeleteConfirm(false);
  };

  const toggleSelection = (reviewId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    setIsDeleting(true);
    const ids = Array.from(selectedIds);
    try {
      const responses = await Promise.all(
        ids.map((reviewId) => fetch(`/api/reviews/${reviewId}`, { method: "DELETE" }))
      );
      const failed = responses.filter((response) => !response.ok);
      if (failed.length > 0) {
        throw new Error("Some reviews could not be deleted. Try again.");
      }
      setReviews((current) => current.filter((review) => !selectedIds.has(review.id)));
      setSelectedIds(new Set());
      setIsEditing(false);
      setShowDeleteConfirm(false);
      addToast(
        `Deleted ${ids.length} review${ids.length === 1 ? "" : "s"}.`,
        "success"
      );
    } catch (deleteFailure) {
      addToast(
        deleteFailure instanceof Error ? deleteFailure.message : "Failed to delete reviews.",
        "error"
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
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/reviews">
                Reviews
              </Link>
              <Link className="text-sm font-medium text-white" href="/my-reviews">
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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">My Reviews</h1>
            <p className="text-sm text-[var(--app-muted)]">
              All of your recent review entries in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center rounded-lg border border-[var(--app-border-strong)] px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-[var(--app-primary)] hover:text-white"
              href="/reviews"
            >
              Log a new review
            </Link>
            <Button variant="outline" onClick={toggleEdit}>
              {isEditing ? "Done" : "Edit reviews"}
            </Button>
            {isEditing ? (
              <Button
                variant="outline"
                className="border-red-500/40 text-red-200 hover:border-red-400 hover:text-red-100"
                disabled={selectedIds.size === 0 || isDeleting}
                onClick={() => setShowDeleteConfirm(true)}
              >
                {isDeleting ? "Deleting..." : `Delete selected (${selectedIds.size})`}
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-3 text-sm text-[var(--app-muted)]">
            Loading reviews...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {showDeleteConfirm ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Delete {selectedIds.size} review{selectedIds.size === 1 ? "" : "s"}? This
                cannot be undone.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="text-red-200 hover:text-white"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-500/80 text-white hover:bg-red-500"
                  disabled={isDeleting}
                  onClick={handleDeleteSelected}
                >
                  {isDeleting ? "Deleting..." : "Confirm delete"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && reviews.length === 0 ? (
          <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-4 py-6 text-sm text-[var(--app-muted)]">
            No reviews yet. Start by logging a review on the dashboard.
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {reviews.map((review) => {
            const posterUrl = review.title.posterPath
              ? `https://image.tmdb.org/t/p/w500${review.title.posterPath}`
              : null;
            const releaseYear = review.title.releaseDate
              ? review.title.releaseDate.slice(0, 4)
              : null;
            const displayDate = formatDate(review.watchedOn || review.createdAt);
            const isSelected = selectedIds.has(review.id);

            const content = (
              <>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--app-muted)]">
                    <span className="font-semibold text-white">{review.title.title}</span>
                    <span className="text-[var(--app-muted)]">
                      {review.title.mediaType === "tv" ? "Series" : "Film"}
                      {releaseYear ? ` Â· ${releaseYear}` : ""}
                    </span>
                    {displayDate ? <span>Â· {displayDate}</span> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {review.rating !== null ? <RatingStars rating={review.rating} /> : null}
                    {review.liked ? (
                      <span className="rounded-full bg-pink-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-pink-300">
                        Liked
                      </span>
                    ) : null}
                    {review.containsSpoilers ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                        Spoilers
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-[var(--app-muted)] line-clamp-2">{review.body}</p>

                  {review.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-[var(--app-muted)]">
                      {review.tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="rounded-full border border-[var(--app-border)] px-2 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 justify-start sm:justify-end">
                  <div
                    className="h-24 w-16 overflow-hidden rounded-lg bg-[var(--app-border)] bg-cover bg-center shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{
                      backgroundImage: posterUrl ? `url('${posterUrl}')` : "var(--app-gradient-poster)",
                    }}
                    aria-hidden="true"
                  />
                </div>
              </>
            );

            if (isEditing) {
              return (
                <div
                  key={review.id}
                  className="group flex flex-col gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 transition-colors hover:border-[var(--app-primary)]/60 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-[var(--app-border-strong)] bg-[var(--app-panel)] text-[var(--app-primary)]"
                      checked={isSelected}
                      onChange={() => toggleSelection(review.id)}
                      aria-label={`Select review for ${review.title.title}`}
                    />
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                      {content}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={review.id}
                className="group flex flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 transition-colors hover:border-[var(--app-primary)]/60"
              >
                <Link
                  href={`/reviews/${encodeURIComponent(review.id)}`}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  {content}
                </Link>
                <div className="flex items-center gap-2">
                  <AddToListButton
                    tmdbId={review.title.tmdbId}
                    mediaType={review.title.mediaType}
                    source="tmdb"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
