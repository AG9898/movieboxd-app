import "server-only";

import { tmdbSearch, type TmdbSearchResponse } from "@/lib/tmdb";
import { tvmazeSearch } from "@/lib/tvmaze";

export type CatalogResult = {
  source: "tmdb" | "tvmaze";
  mediaType: "movie" | "tv";
  externalId: number;
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
};

export type CatalogSearchParams = {
  q: string;
  type: "movie" | "tv" | "multi";
  page?: number;
};

export type CatalogSearchResponse = {
  page: number;
  totalResults: number;
  results: CatalogResult[];
};

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

function extractYear(dateString?: string | null): number | null {
  if (!dateString) return null;
  const year = Number(dateString.slice(0, 4));
  return Number.isNaN(year) ? null : year;
}

function stripHtml(input?: string | null): string | null {
  if (!input) return null;
  return input.replace(/<[^>]+>/g, "").trim() || null;
}

function mapTmdbResults(
  response: TmdbSearchResponse,
  type: "movie" | "tv" | "multi"
): CatalogResult[] {
  return response.results.flatMap((item) => {
    const mediaType =
      type === "multi" ? item.media_type : type;

    if (mediaType !== "movie" && mediaType !== "tv") {
      return [];
    }

    const title = mediaType === "movie" ? item.title : item.name;
    if (!title) return [];

    const releaseDate =
      mediaType === "movie" ? item.release_date : item.first_air_date;

    return [
      {
        source: "tmdb",
        mediaType,
        externalId: item.id,
        title,
        year: extractYear(releaseDate),
        overview: item.overview ?? null,
        posterUrl: item.poster_path ? `${TMDB_POSTER_BASE}${item.poster_path}` : null,
        backdropUrl: item.backdrop_path
          ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}`
          : null,
      },
    ];
  });
}

export async function catalogSearch({
  q,
  type,
  page = 1,
}: CatalogSearchParams): Promise<CatalogSearchResponse> {
  const tmdbResponse = await tmdbSearch(q, type, page);
  const tmdbResults = mapTmdbResults(tmdbResponse, type);

  if (tmdbResults.length > 0) {
    return {
      page: tmdbResponse.page,
      totalResults: tmdbResponse.total_results,
      results: tmdbResults,
    };
  }

  if (type === "movie") {
    return {
      page: tmdbResponse.page,
      totalResults: 0,
      results: [],
    };
  }

  const tvmazeResults = await tvmazeSearch(q);
  const mapped = tvmazeResults.map((entry) => {
    const show = entry.show;
    return {
      source: "tvmaze",
      mediaType: "tv",
      externalId: show.id,
      title: show.name,
      year: extractYear(show.premiered),
      overview: stripHtml(show.summary),
      posterUrl: show.image?.medium ?? show.image?.original ?? null,
      backdropUrl: null,
    } satisfies CatalogResult;
  });

  return {
    page: 1,
    totalResults: mapped.length,
    results: mapped,
  };
}
