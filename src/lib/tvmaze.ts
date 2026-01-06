import "server-only";

import { env } from "@/lib/env";
import { ApiError } from "@/lib/tmdb";

const TVMAZE_BASE_URL = env.TVMAZE_BASE_URL;

async function tvmazeFetch<T>(path: string): Promise<T> {
  const url = new URL(path, TVMAZE_BASE_URL);
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = `TVmaze request failed with status ${response.status}.`;
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export type TvmazeSearchResponse = Array<{
  score: number;
  show: {
    id: number;
    name: string;
    premiered?: string | null;
    summary?: string | null;
    genres?: string[];
    image?: {
      medium?: string | null;
      original?: string | null;
    } | null;
  };
}>;

export async function tvmazeSearch(query: string): Promise<TvmazeSearchResponse> {
  return tvmazeFetch<TvmazeSearchResponse>(`/search/shows?q=${encodeURIComponent(query)}`);
}

export type TvmazeShowResponse = {
  id: number;
  name: string;
  premiered?: string | null;
  summary?: string | null;
  genres?: string[];
  image?: {
    medium?: string | null;
    original?: string | null;
  } | null;
};

export async function tvmazeGetShow(id: number): Promise<TvmazeShowResponse> {
  return tvmazeFetch<TvmazeShowResponse>(`/shows/${id}`);
}
