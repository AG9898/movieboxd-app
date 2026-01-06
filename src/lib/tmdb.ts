import "server-only";

import { env } from "@/lib/env";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbFetchParams = Record<string, string | number | boolean | undefined>;

async function tmdbFetch<T>(path: string, params: TmdbFetchParams = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `TMDB request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as { status_message?: string };
      if (payload?.status_message) {
        message = payload.status_message;
      }
    } catch {
      // Ignore parse errors and use fallback message.
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export type TmdbSearchResponse = {
  page: number;
  total_results: number;
  total_pages: number;
  results: Array<{
    id: number;
    media_type?: "movie" | "tv" | "person";
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
  }>;
};

export async function tmdbSearch(
  query: string,
  type: "movie" | "tv" | "multi",
  page = 1
): Promise<TmdbSearchResponse> {
  return tmdbFetch<TmdbSearchResponse>(`/search/${type}`, {
    query,
    page,
    include_adult: false,
  });
}

export type TmdbDetailsResponse = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  runtime?: number | null;
  episode_run_time?: number[];
  genres?: Array<{ id: number; name: string }>;
};

export async function tmdbGetDetails(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<TmdbDetailsResponse> {
  return tmdbFetch<TmdbDetailsResponse>(`/${mediaType}/${tmdbId}`);
}
