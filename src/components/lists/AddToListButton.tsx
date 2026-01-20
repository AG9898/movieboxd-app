"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  privacy: "public" | "private" | "friends";
};

type AddToListButtonProps = {
  tmdbId: number | null;
  mediaType: "movie" | "tv";
  source?: "tmdb" | "tvmaze";
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
};

export default function AddToListButton({
  tmdbId,
  mediaType,
  source = "tmdb",
  label = "Add to list",
  size = "sm",
  variant = "outline",
  disabled,
}: AddToListButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToast } = useToast();

  const canInteract = useMemo(
    () => Boolean(tmdbId) && !disabled,
    [disabled, tmdbId]
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadLists = async () => {
      setIsLoading(true);
      // no-op
      try {
        const response = await fetch("/api/lists", { cache: "no-store" });
        if (response.status === 401) {
          addToast("Sign in to manage your lists.", "error");
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.href = `/sign-in?next=${encodeURIComponent(nextPath)}`;
          return;
        }
        const payload = (await response.json()) as
          | { ok: true; data: ListSummary[] }
          | { ok: false; error: { message?: string } };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Failed to load lists." : payload.error?.message);
        }

        if (!cancelled) {
          setLists(payload.data);
        }
      } catch (error) {
        if (!cancelled) {
          addToast(
            error instanceof Error ? error.message : "Failed to load lists.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLists();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleAdd(listId: string) {
    if (!tmdbId) return;
    setIsAdding(true);
    try {
      const hydrateResponse = await fetch("/api/catalog/hydrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          externalId: tmdbId,
          mediaType,
        }),
      });
      if (hydrateResponse.status === 401) {
        addToast("Sign in to add items to lists.", "error");
        const nextPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/sign-in?next=${encodeURIComponent(nextPath)}`;
        return;
      }
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
        },
        body: JSON.stringify({
          tmdbId,
          mediaType,
          note: "",
        }),
      });
      if (response.status === 401) {
        addToast("Sign in to add items to lists.", "error");
        const nextPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/sign-in?next=${encodeURIComponent(nextPath)}`;
        return;
      }
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message?: string } };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Add to list failed." : payload.error?.message);
      }

      addToast("Added to list.", "success");
      setOpen(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Add to list failed.", "error");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        size={size}
        variant={variant}
        disabled={!canInteract}
      >
        {label}
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Add to list</span>
            <button
              className="text-xs text-[var(--app-muted)] hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
          {isLoading ? (
            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2 text-xs text-[var(--app-muted)]">
              Loading lists...
            </div>
          ) : lists.length === 0 ? (
            <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2 text-xs text-[var(--app-muted)]">
              No lists yet. Create one from the Lists page.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  className="flex items-center justify-between rounded-lg border border-transparent bg-[var(--app-card)] px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-[var(--app-border-strong)]"
                  disabled={isAdding}
                  onClick={() => handleAdd(list.id)}
                  type="button"
                >
                  <span className="font-semibold">{list.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--app-muted)]">
                    {list.privacy}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
