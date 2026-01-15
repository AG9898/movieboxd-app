"use client";

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
  rating: number;
  posterUrl: string | null;
  note: string;
  tmdbId?: number;
  mediaType?: "movie" | "tv";
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const lastSavedMeta = useRef<{ name: string; description: string; privacy: string } | null>(
    null
  );
  const suppressAutoSave = useRef(false);

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
          | { ok: true; data: Array<{ id: string; rank: number; note: string | null; title: {
              tmdbId: number; mediaType: string; title: string; releaseDate: string | null; posterPath: string | null;
            } }> }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load list items." : payload.error?.message);
        }

        if (!cancelled) {
          const mapped = payload.data.map((item) => ({
            id: item.id,
            title: item.title.title,
            year: item.title.releaseDate ? Number(item.title.releaseDate.slice(0, 4)) : null,
            rating: 0,
            posterUrl: item.title.posterPath
              ? `https://image.tmdb.org/t/p/w500${item.title.posterPath}`
              : null,
            note: item.note ?? "",
            tmdbId: item.title.tmdbId,
            mediaType: item.title.mediaType === "tv" ? "tv" : "movie",
          }));
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
    const tempId = `temp-${result.source}-${result.externalId}`;
    const rank = items.length + 1;
    setItems((current) => {
      const exists = current.some(
        (item) => item.tmdbId === result.externalId && item.mediaType === result.mediaType
      );
      if (exists) {
        setToast("Already in list.");
        return current;
      }
      return [
        ...current,
        {
          id: tempId,
          title: result.title,
          year: result.year,
          rating: 0,
          posterUrl: result.posterUrl,
          note: "",
          tmdbId: result.externalId,
          mediaType: result.mediaType,
        },
      ];
    });
    setQuery("");
    setResults([]);

    try {
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
    <div className="min-h-screen bg-[#101622] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#222f49] bg-[#101623]/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d59f2]/20 text-[#0d59f2]">
              <svg
                className="h-5 w-5"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM24 40C15.16 40 8 32.84 8 24C8 15.16 15.16 8 24 8C32.84 8 40 15.16 40 24C40 32.84 32.84 40 24 40Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M24 12C17.37 12 12 17.37 12 24C12 30.63 17.37 36 24 36C30.63 36 36 30.63 36 24C36 17.37 30.63 12 24 12ZM24 32C19.58 32 16 28.42 16 24C16 19.58 19.58 16 24 16C28.42 16 32 19.58 32 24C32 28.42 28.42 32 24 32Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-[-0.015em]">CineTrack</h2>
          </div>
          <div className="hidden md:block text-xs text-[#90a4cb]">
            Curate lists
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div
            className="h-10 w-10 rounded-full border-2 border-[#0d59f2] bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDbvGlbs6KmGkEUHDVMbWY0fO2fnDohQ-P400L4l9TgNH96h58-6qpoUgkO62zNW_f95wUVAmi3OgwYuAOoRQNivoof2ri8Ro2mfNcWFoBUwiDMfyKCveSfucmqeGY5cXCGtX6h_TFq-f_-c6RJh3lV4-MPAvCSQTOh6YJn1pp3xNyyZC0BtPguNUJc54grLXudQ8mcpWN7IifCTQrlQyocZ6H94h2qdD_3gT8NnCrejtj0BpXlQVsK-lm8EJT3LgA6OsPkQp_-dQ')",
            }}
          />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-5xl flex-col gap-8">
          <section className="rounded-2xl border border-[#314368]/30 bg-[#182234] p-6 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Edit List Details</h1>
              <p className="text-sm text-[#90a4cb]">
                Curate and manage your movie collections.
              </p>
            </div>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">List Name</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#314368] bg-[#101623] p-3 text-white focus:border-[#0d59f2] focus:ring-[#0d59f2]"
                  type="text"
                  value={listName}
                  onChange={(event) => setListName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Privacy</span>
                <div className="relative">
                  <select
                    className="h-12 w-full appearance-none rounded-xl border border-[#314368] bg-[#101623] p-3 text-white focus:border-[#0d59f2] focus:ring-[#0d59f2]"
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
                className="min-h-[100px] w-full resize-y rounded-xl border border-[#314368] bg-[#101623] p-3 text-white focus:border-[#0d59f2] focus:ring-[#0d59f2]"
                placeholder="Add a description..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#314368]/30 bg-[#182234] p-4 md:flex-row">
              <div className="relative w-full flex-1">
                <span className="absolute left-3 top-3 text-[#0d59f2]">+</span>
                <input
                  className="h-12 w-full rounded-lg border border-[#314368] bg-[#101623] pl-11 pr-4 text-white placeholder:text-[#90a4cb] focus:border-[#0d59f2] focus:ring-1 focus:ring-[#0d59f2]"
                  placeholder="Search for a film to add..."
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="flex w-full items-center justify-end gap-3 md:w-auto" />
            </div>

            <div className="rounded-xl border border-[#314368]/30 bg-[#182234] p-4 text-xs text-[#90a4cb]">
              <div className="flex items-center justify-between">
                <span>{resultLabel}</span>
                {error ? <span className="text-red-300">{error}</span> : null}
              </div>
              {results.length > 0 ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {results.map((result) => (
                    <button
                      key={`${result.source}-${result.externalId}-${result.mediaType}`}
                      className="flex items-center gap-3 rounded-lg border border-transparent bg-[#101623] px-3 py-2 text-left text-slate-200 transition-colors hover:border-[#314368]"
                      onClick={() => handleAdd(result)}
                      type="button"
                    >
                      <div
                        className="h-12 w-9 shrink-0 rounded bg-cover bg-center"
                        style={{
                          backgroundImage: result.posterUrl
                            ? `url('${result.posterUrl}')`
                            : "none",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{result.title}</p>
                        <p className="text-xs text-[#90a4cb]">
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
              <div className="rounded-lg border border-[#314368]/30 bg-[#182234] px-4 py-3 text-sm text-[#90a4cb]">
                Loading list items...
              </div>
            ) : null}

            {isSavingOrder ? (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                Saving order...
              </div>
            ) : null}

            {savingNoteId ? (
              <div className="rounded-lg border border-[#314368]/30 bg-[#182234] px-4 py-3 text-sm text-[#90a4cb]">
                Saving note...
              </div>
            ) : null}

            {isAutoSavingMeta ? (
              <div className="rounded-lg border border-[#314368]/30 bg-[#182234] px-4 py-3 text-sm text-[#90a4cb]">
                Saving list details...
              </div>
            ) : null}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`group flex flex-col items-center gap-4 rounded-xl border bg-[#182234] p-4 transition-colors sm:flex-row ${
                    dragOverId === item.id
                      ? "border-[#0d59f2]/70"
                      : "border-[#314368]/30 hover:border-[#0d59f2]/50"
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
                        : "linear-gradient(135deg, #1f2a44, #182234)",
                    }}
                  />
                  <div className="flex w-full flex-1 flex-col gap-1 text-center sm:text-left">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      {item.year ? (
                        <span className="text-sm text-[#90a4cb]">({item.year})</span>
                      ) : null}
                    </div>
                    <StarRow rating={item.rating} />
                    <input
                      className="mt-2 w-full border-0 border-b border-[#314368] bg-transparent px-0 py-1 text-sm text-[#d7dde8] placeholder:text-[#90a4cb] focus:border-[#0d59f2] focus:ring-0"
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
                    <button
                      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleRemove(item.id)}
                      type="button"
                    >
                      ✕
                    </button>
                    <button className="rounded-full p-2 text-gray-400 transition-colors hover:text-[#0d59f2] sm:hidden">
                      ☰
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 cursor-pointer rounded-xl border-2 border-dashed border-[#314368] p-8 text-center transition-colors hover:bg-[#182234]/50">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#314368]/50 text-[#0d59f2]">
                +
              </div>
              <p className="font-medium text-white">Add more films</p>
              <p className="text-sm text-[#90a4cb]">
                Search above or drag films here from your watchlist
              </p>
            </div>
          </section>
        </div>
      </main>

      <div className="px-6">
        <details className="rounded-lg border border-[#314368]/30 bg-[#182234] px-4 py-3 text-xs text-[#90a4cb]">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Admin passphrase (only if writes are locked)
          </summary>
          <div className="mt-2">
            <input
              className="w-full rounded-lg border border-[#314368] bg-[#101623] px-3 py-2 text-sm text-white placeholder-[#90a4cb]"
              placeholder="Optional admin passphrase"
              type="password"
              value={adminPassphrase}
              onChange={(event) => setAdminPassphrase(event.target.value)}
            />
          </div>
        </details>
      </div>

      <div className="sticky bottom-0 z-40 w-full border-t border-[#314368]/30 bg-[#182234] px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="hidden items-center gap-2 text-sm text-[#90a4cb] sm:flex">
            <span className="text-orange-400">✎</span>
            <span>Unsaved changes</span>
          </div>
          <div className="flex w-full items-center justify-end gap-4 sm:w-auto">
            <button
              className="h-10 rounded-lg px-6 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleDelete}
              type="button"
              disabled={isSaving}
            >
              Delete List
            </button>
            <button
              className="h-10 rounded-lg bg-[#222f49] px-4 text-sm font-medium text-white transition-colors hover:bg-[#314368]"
              type="button"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </button>
            <button
              className="h-10 rounded-lg bg-[#0d59f2] px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-3xl rounded-2xl border border-[#314368]/60 bg-[#101623] p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{listName || "Untitled list"}</h2>
                <p className="mt-1 text-sm text-[#90a4cb]">
                  {privacy === "public" ? "Public list" : privacy === "friends" ? "Friends only" : "Private"}
                </p>
              </div>
              <button
                className="rounded-full border border-[#314368] px-3 py-1 text-xs text-[#90a4cb] hover:text-white"
                onClick={() => setPreviewOpen(false)}
                type="button"
              >
                Close
              </button>
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
                        : "linear-gradient(135deg, #1f2a44, #182234)",
                    }}
                  />
                  <div>
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    {item.year ? (
                      <p className="text-xs text-[#90a4cb]">{item.year}</p>
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
