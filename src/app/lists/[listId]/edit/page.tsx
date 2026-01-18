"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
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

type ListItem = {
  id: string;
  title: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  note: string;
  tmdbId?: number;
  mediaType?: "movie" | "tv";
  reviewId?: string;
  reviewRating?: number | null;
  reviewDate?: string | null;
};

const initialItems: ListItem[] = [];

function StarRow({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-1 text-yellow-500">
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = index <= fullStars;
        const isHalf = index === fullStars + 1 && halfStar;
        const opacity = isFilled ? "opacity-100" : isHalf ? "opacity-70" : "opacity-30";
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

export default function CurateListPage() {
  const params = useParams();
  const listId = Array.isArray(params?.listId) ? params.listId[0] : params?.listId;
  const [listName, setListName] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [isAutoSavingMeta, setIsAutoSavingMeta] = useState(false);
  const [adminPassphrase, setAdminPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const hasLoadedItems = useRef(false);
  const isDeleted = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const lastSavedMeta = useRef<{ name: string; description: string; privacy: string } | null>(
    null
  );
const suppressAutoSave = useRef(false);

function formatReviewDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  const resultLabel = useMemo(() => {
    if (!canSearch) return "Type 2+ characters to search.";
    if (isSearching) return "Searching catalog...";
    if (results.length === 0) return "No results yet.";
    return `${results.length} results`;
  }, [canSearch, isSearching, results.length]);

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
        url.searchParams.set("type", "movie");
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
  }, [canSearch, trimmedQuery]);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(handle);
  }, [toast]);

  useEffect(() => {
    if (!listId) return;
    let cancelled = false;

    const fetchList = async () => {
      setError(null);
      try {
        const response = await fetch(`/api/lists/${listId}`);
        const payload = (await response.json()) as
          | { ok: true; data: { name: string; description: string | null; privacy: string } }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load list." : payload.error?.message);
        }

        if (!cancelled) {
          setListName(payload.data.name);
          setDescription(payload.data.description ?? "");
          setPrivacy(payload.data.privacy);
          lastSavedMeta.current = {
            name: payload.data.name,
            description: payload.data.description ?? "",
            privacy: payload.data.privacy,
          };
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load list.");
          setListName("");
          setDescription("");
          setPrivacy("public");
          setItems([]);
        }
      }
    };

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/lists/${listId}/items`);
        const payload = (await response.json()) as
          | {
              ok: true;
              data: Array<{
                id: string;
                rank: number;
                note: string | null;
                title: {
                  tmdbId: number;
                  mediaType: "movie" | "tv";
                  title: string;
                  releaseDate: string | null;
                  posterPath: string | null;
                };
                latestReview: {
                  id: string;
                  rating: number | null;
                  watchedOn: string | null;
                  createdAt: string;
                } | null;
              }>;
            }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load list items." : payload.error?.message);
        }

        if (!cancelled) {
          const mapped: ListItem[] = payload.data.map((item) => {
            const reviewDate = item.latestReview?.watchedOn ?? item.latestReview?.createdAt ?? null;
            const mediaType: ListItem["mediaType"] =
              item.title.mediaType === "tv" ? "tv" : "movie";
            return {
              id: item.id,
              title: item.title.title,
              year: item.title.releaseDate ? Number(item.title.releaseDate.slice(0, 4)) : null,
              rating: item.latestReview?.rating ?? null,
              posterUrl: item.title.posterPath
                ? `https://image.tmdb.org/t/p/w500${item.title.posterPath}`
                : null,
              note: item.note ?? "",
              tmdbId: item.title.tmdbId,
              mediaType,
              reviewId: item.latestReview?.id,
              reviewRating: item.latestReview?.rating ?? null,
              reviewDate,
            };
          });
          setItems(mapped);
          hasLoadedItems.current = true;
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load list.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchList();
    fetchItems();

    return () => {
      cancelled = true;
    };
  }, [listId]);

  useEffect(() => {
    if (!listId || !hasLoadedItems.current) return;
    const validItems = items.filter((item) => !item.id.startsWith("temp-"));
    if (validItems.length === 0) return;

    const handle = setTimeout(async () => {
      setIsSavingOrder(true);
      setError(null);
      try {
        const response = await fetch(`/api/lists/${listId}/items`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
          },
          body: JSON.stringify({
            items: validItems.map((item, index) => ({
              id: item.id,
              rank: index + 1,
            })),
          }),
        });
        const payload = (await response.json()) as
          | { ok: true }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Reorder failed." : payload.error?.message);
        }
      } catch (reorderError) {
        setError(reorderError instanceof Error ? reorderError.message : "Reorder failed.");
      } finally {
        setIsSavingOrder(false);
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [adminPassphrase, items, listId]);

  async function handleAdd(result: CatalogResult) {
    if (!listId) {
      setToast("List ID missing.");
      return;
    }
    const exists = items.some(
      (item) => item.tmdbId === result.externalId && item.mediaType === result.mediaType
    );
    if (exists) {
      setToast("Already in list.");
      return;
    }
    const tempId = `temp-${result.source}-${result.externalId}`;
    const rank = items.length + 1;
    setItems((current) => {
      return [
        ...current,
        {
          id: tempId,
          title: result.title,
          year: result.year,
          rating: null,
          posterUrl: result.posterUrl,
          note: "",
          tmdbId: result.externalId,
          mediaType: result.mediaType,
          reviewRating: null,
          reviewDate: null,
        },
      ];
    });
    setQuery("");
    setResults([]);

    try {
      const hydrateResponse = await fetch("/api/catalog/hydrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({
          source: result.source,
          externalId: result.externalId,
          mediaType: result.mediaType,
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

      const response = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({
          tmdbId: result.externalId,
          mediaType: result.mediaType,
          rank,
          note: "",
        }),
      });
      const payload = (await response.json()) as
        | { ok: true; data: { id: string } }
        | { ok: false; error: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Add to list failed." : payload.error?.message);
      }

      setItems((current) =>
        current.map((item) =>
          item.id === tempId ? { ...item, id: payload.data.id } : item
        )
      );
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Add to list failed.");
      setItems((current) => current.filter((item) => item.id !== tempId));
    }
  }

  async function handleRemove(id: string) {
    if (!listId) {
      setToast("List ID missing.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));

    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({ id }),
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Remove failed." : payload.error?.message);
      }
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Remove failed.");
    }
  }

  function moveItem(fromId: string, toId: string) {
    setItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === fromId);
      const toIndex = current.findIndex((item) => item.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function handleNoteSave(id: string, note: string) {
    if (!listId) {
      setToast("List ID missing.");
      return;
    }

    setSavingNoteId(id);
    setError(null);
    const previousNote = items.find((item) => item.id === id)?.note ?? "";
    if (note.length > 500) {
      setError("Notes must be 500 characters or less.");
      setItems((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, note: previousNote } : entry
        )
      );
      setSavingNoteId(null);
      return;
    }
    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({ id, note }),
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Note update failed." : payload.error?.message);
      }
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Note update failed.");
      setItems((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, note: previousNote } : entry
        )
      );
    } finally {
      setSavingNoteId(null);
    }
  }

  async function handleSave() {
    if (!listId) {
      setToast("List ID missing.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
        body: JSON.stringify({
          name: listName,
          description,
          privacy,
        }),
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Save failed." : payload.error?.message);
      }

      setToast("List saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!listId) return;
    if (!hasLoadedItems.current) return;
    if (!lastSavedMeta.current) return;
    if (isDeleted.current) return;
    if (suppressAutoSave.current) return;

    const metaChanged =
      lastSavedMeta.current.name !== listName ||
      lastSavedMeta.current.description !== description ||
      lastSavedMeta.current.privacy !== privacy;

    if (!metaChanged) return;

    const handle = setTimeout(async () => {
      setIsAutoSavingMeta(true);
      setError(null);
      try {
        const response = await fetch(`/api/lists/${listId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
          },
          body: JSON.stringify({
            name: listName,
            description,
            privacy,
          }),
        });
        const payload = (await response.json()) as
          | { ok: true }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Auto-save failed." : payload.error?.message);
        }

        lastSavedMeta.current = {
          name: listName,
          description,
          privacy,
        };
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Auto-save failed.");
        if (lastSavedMeta.current) {
          suppressAutoSave.current = true;
          setListName(lastSavedMeta.current.name);
          setDescription(lastSavedMeta.current.description);
          setPrivacy(lastSavedMeta.current.privacy);
          setToast("Auto-save failed. Reverted changes.");
          setTimeout(() => {
            suppressAutoSave.current = false;
          }, 0);
        }
      } finally {
        setIsAutoSavingMeta(false);
      }
    }, 800);

    return () => clearTimeout(handle);
  }, [adminPassphrase, description, listId, listName, privacy]);

  async function handleDelete() {
    if (!listId) {
      setToast("List ID missing.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
        headers: {
          ...(adminPassphrase ? { "x-admin-passphrase": adminPassphrase } : {}),
        },
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Delete failed." : payload.error?.message);
      }

      isDeleted.current = true;
      suppressAutoSave.current = true;
      lastSavedMeta.current = null;
      setToast("List deleted.");
      setItems([]);
      setListName("");
      setDescription("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setIsSaving(false);
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
              <Link className="text-sm font-medium text-slate-300 transition-colors hover:text-white" href="/to-watch">
                To Watch
              </Link>
              <Link className="text-sm font-medium text-white" href="/lists">
                Lists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-5xl flex-col gap-8">
          <section className="rounded-2xl border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] p-6 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Edit List Details</h1>
              <p className="text-sm text-[var(--app-muted)]">
                Curate and manage your movie collections.
              </p>
            </div>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">List Name</span>
                <input
                  className="h-12 w-full rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-panel)] p-3 text-white focus:border-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                  type="text"
                  value={listName}
                  onChange={(event) => setListName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Privacy</span>
                <div className="relative">
                  <select
                    className="h-12 w-full appearance-none rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-panel)] p-3 text-white focus:border-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                    value={privacy}
                    onChange={(event) => setPrivacy(event.target.value)}
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
                className="min-h-[100px] w-full resize-y rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-panel)] p-3 text-white focus:border-[var(--app-primary)] focus:ring-[var(--app-primary)]"
                placeholder="Add a description..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] p-4 md:flex-row">
              <div className="relative w-full flex-1">
                <span className="absolute left-3 top-3 text-[var(--app-primary)]">+</span>
                <input
                  className="h-12 w-full rounded-lg border border-[var(--app-border-strong)] bg-[var(--app-panel)] pl-11 pr-4 text-white placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]"
                  placeholder="Search for a film to add..."
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="flex w-full items-center justify-end gap-3 md:w-auto" />
            </div>

            <div className="rounded-xl border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] p-4 text-xs text-[var(--app-muted)]">
              <div className="flex items-center justify-between">
                <span>{resultLabel}</span>
                {error ? <span className="text-red-300">{error}</span> : null}
              </div>
              {results.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 sm:mx-auto sm:max-w-[720px]">
                  {results.map((result) => (
                    <button
                      key={`${result.source}-${result.externalId}-${result.mediaType}`}
                      className="grid w-full min-h-[64px] grid-cols-[56px_1fr] items-center justify-items-start gap-x-4 rounded-lg border border-transparent bg-[var(--app-panel)] px-3 py-2 text-left text-slate-200 transition-colors hover:border-[var(--app-border-strong)]"
                      onClick={() => handleAdd(result)}
                      type="button"
                    >
                      <div
                        className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[var(--app-border)] bg-cover bg-center"
                        style={{
                          backgroundImage: result.posterUrl
                            ? `url('${result.posterUrl}')`
                            : "var(--app-gradient-poster)",
                        }}
                      />
                      <div className="flex min-w-0 flex-col justify-center">
                        <p className="truncate text-sm font-semibold">{result.title}</p>
                        <p className="truncate text-xs text-[var(--app-muted)]">
                          {result.year ? `${result.year} • ` : ""}
                          {result.mediaType.toUpperCase()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {toast ? (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {toast}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-lg border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-muted)]">
                Loading list items...
              </div>
            ) : null}

            {isSavingOrder ? (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Saving order...
              </div>
            ) : null}

            {savingNoteId ? (
              <div className="rounded-lg border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-muted)]">
                Saving note...
              </div>
            ) : null}

            {isAutoSavingMeta ? (
              <div className="rounded-lg border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] px-4 py-3 text-sm text-[var(--app-muted)]">
                Saving list details...
              </div>
            ) : null}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`group flex flex-col items-center gap-4 rounded-xl border bg-[var(--app-surface)] p-4 transition-colors sm:flex-row ${
                    dragOverId === item.id
                      ? "border-[var(--app-primary)]/70"
                      : "border-[var(--app-border-strong)]/30 hover:border-[var(--app-primary)]/50"
                  }`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", item.id);
                    setDraggingId(item.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const draggedId = event.dataTransfer.getData("text/plain");
                    if (draggedId) {
                      moveItem(draggedId, item.id);
                    }
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                >
                  <div className="hidden text-gray-400 sm:flex">
                    {draggingId === item.id ? "⠿" : "☰"}
                  </div>
                  <div className="w-12 text-center text-3xl font-bold text-white/10">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="h-24 w-16 shrink-0 rounded-lg bg-cover bg-center shadow-md"
                    style={{
                      backgroundImage: item.posterUrl
                        ? `url('${item.posterUrl}')`
                        : "var(--app-gradient-poster)",
                    }}
                  />
                  <div className="flex w-full flex-1 flex-col gap-1 text-center sm:text-left">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      {item.year ? (
                        <span className="text-sm text-[var(--app-muted)]">({item.year})</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {item.reviewRating !== null ? (
                        <>
                          <StarRow rating={item.reviewRating} />
                          {item.reviewDate ? (
                            <span className="text-xs text-[var(--app-muted)]">
                              Reviewed {formatReviewDate(item.reviewDate)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs text-[var(--app-muted)]">No review yet.</span>
                      )}
                      {item.tmdbId ? (
                        <Link
                          className="text-xs font-semibold text-[var(--app-primary)] transition-colors hover:text-white"
                          href={`/review/${item.tmdbId}?mediaType=${item.mediaType ?? "movie"}`}
                        >
                          Write review
                        </Link>
                      ) : null}
                    </div>
                    <input
                      className="mt-2 w-full border-0 border-b border-[var(--app-border-strong)] bg-transparent px-0 py-1 text-sm text-[#d7dde8] placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)] focus:ring-0"
                      placeholder="Add a note on why this film is included..."
                      value={item.note}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, note: event.target.value }
                              : entry
                          )
                        )
                      }
                      onBlur={(event) => handleNoteSave(item.id, event.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col">
                    <Button
                      variant="unstyled"
                      size="none"
                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleRemove(item.id)}
                      type="button"
                    >
                      ✕
                    </Button>
                    <Button
                      variant="unstyled"
                      size="none"
                      className="rounded-full p-2 text-gray-400 transition-colors hover:text-[var(--app-primary)] sm:hidden"
                      type="button"
                    >
                      ☰
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {!isLoading && items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--app-border-strong)]/60 bg-[var(--app-surface)]/60 px-4 py-6 text-center text-sm text-[var(--app-muted)]">
                No films yet. Use the search above to add your first title.
              </div>
            ) : null}

          </section>
        </div>
      </main>

      <div className="px-6">
        <details className="rounded-lg border border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] px-4 py-3 text-xs text-[var(--app-muted)]">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Admin passphrase (only if writes are locked)
          </summary>
          <div className="mt-2">
            <input
              className="w-full rounded-lg border border-[var(--app-border-strong)] bg-[var(--app-panel)] px-3 py-2 text-sm text-white placeholder-[var(--app-muted)]"
              placeholder="Optional admin passphrase"
              type="password"
              value={adminPassphrase}
              onChange={(event) => setAdminPassphrase(event.target.value)}
            />
          </div>
        </details>
      </div>

      <div className="sticky bottom-0 z-40 w-full border-t border-[var(--app-border-strong)]/30 bg-[var(--app-surface)] px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="hidden items-center gap-2 text-sm text-[var(--app-muted)] sm:flex">
            <span className="text-orange-400">✎</span>
            <span>Unsaved changes</span>
          </div>
          <div className="flex w-full items-center justify-end gap-4 sm:w-auto">
            <Button variant="ghost" className="text-red-400" onClick={handleDelete} disabled={isSaving}>
              Delete List
            </Button>
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--app-border-strong)]/60 bg-[var(--app-panel)] p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{listName || "Untitled list"}</h2>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {privacy === "public" ? "Public list" : privacy === "friends" ? "Friends only" : "Private"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
            {description ? (
              <p className="mt-4 text-sm text-[#d7dde8]">{description}</p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {items.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div
                    className="aspect-[2/3] w-full rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: item.posterUrl
                        ? `url('${item.posterUrl}')`
                        : "var(--app-gradient-poster)",
                    }}
                  />
                  <div>
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    {item.year ? (
                      <p className="text-xs text-[var(--app-muted)]">{item.year}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
