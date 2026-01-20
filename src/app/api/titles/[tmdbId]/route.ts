import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tmdbGetDetails } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const querySchema = z.object({
  mediaType: z.enum(["movie", "tv"]).default("movie"),
});

type RouteContext = { params: Promise<{ tmdbId: string }> };

async function resolveTmdbId(request: NextRequest, context: RouteContext) {
  const url = new URL(request.url);
  const params = await context.params;
  return params?.tmdbId ?? url.pathname.split("/").pop() ?? "";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const url = new URL(request.url);
  const pathId = await resolveTmdbId(request, context);
  const tmdbIdParsed = z.coerce.number().int().positive().safeParse(pathId);
  if (!tmdbIdParsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid tmdbId." } },
      { status: 400 }
    );
  }

  const tmdbId = tmdbIdParsed.data;
  const parsed = querySchema.safeParse({
    mediaType: url.searchParams.get("mediaType") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid query parameters.",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const mediaType = parsed.data.mediaType;
  const title = await prisma.title.findUnique({
    where: {
      tmdbId_mediaType: {
        tmdbId,
        mediaType,
      },
    },
  });

  if (!title) {
    try {
      const details = await tmdbGetDetails(tmdbId, mediaType);
      const releaseDate = details.release_date ?? details.first_air_date ?? null;
      const runtimeMinutes =
        details.runtime ?? details.episode_run_time?.[0] ?? null;
      const response = {
        id: `tmdb-${tmdbId}`,
        tmdbId,
        mediaType,
        title: details.title ?? details.name ?? `TMDB #${tmdbId}`,
        originalTitle: details.original_title ?? details.name ?? null,
        releaseDate,
        posterPath: details.poster_path ?? null,
        backdropPath: details.backdrop_path ?? null,
        overview: details.overview ?? null,
        runtimeMinutes,
        genres: details.genres?.map((genre) => genre.name) ?? [],
        voteAverage: details.vote_average ?? null,
      };

      return NextResponse.json({ ok: true, data: response });
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Title not found." } },
        { status: 404 }
      );
    }
  }

  const response = {
    id: title.id,
    tmdbId: title.tmdbId,
    mediaType: title.mediaType,
    title: title.title,
    originalTitle: title.originalTitle,
    releaseDate: title.releaseDate,
    posterPath: title.posterPath,
    backdropPath: title.backdropPath,
    overview: title.overview,
    runtimeMinutes: title.runtimeMinutes,
    genres: title.genres,
    voteAverage: null,
  };

  return NextResponse.json({ ok: true, data: response });
}
