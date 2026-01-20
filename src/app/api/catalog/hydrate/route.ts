import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdbGetDetails } from "@/lib/tmdb";
import { tvmazeGetShow } from "@/lib/tvmaze";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    source: z.enum(["tmdb", "tvmaze"]),
    externalId: z.number().int().positive(),
    mediaType: z.enum(["movie", "tv"]),
  })
  .refine(
    (value) => (value.source === "tvmaze" ? value.mediaType === "tv" : true),
    {
      message: "TVmaze only supports tv mediaType.",
      path: ["mediaType"],
    }
  );

function parseDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stripHtml(input?: string | null): string | null {
  if (!input) return null;
  return input.replace(/<[^>]+>/g, "").trim() || null;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid request body.",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const { source, externalId } = parsed.data;

    let tmdbId = 0;
    let title = "";
    let originalTitle: string | null = null;
    const mediaType = source === "tvmaze" ? "tv" : parsed.data.mediaType;
    let overview: string | null = null;
    let posterPath: string | null = null;
    let backdropPath: string | null = null;
    let runtimeMinutes: number | null = null;
    let genres: string[] = [];
    let releaseDate: Date | null = null;

    if (source === "tmdb") {
      const details = await tmdbGetDetails(externalId, mediaType);
      const name = mediaType === "movie" ? details.title : details.name;
      if (!name) {
        throw new Error("TMDB title missing name.");
      }

      const releaseDateString =
        mediaType === "movie" ? details.release_date ?? null : details.first_air_date ?? null;
      releaseDate = parseDate(releaseDateString);
      runtimeMinutes =
        mediaType === "movie"
          ? details.runtime ?? null
          : details.episode_run_time?.[0] ?? null;
      genres = details.genres?.map((genre) => genre.name) ?? [];
      tmdbId = details.id;
      title = name;
      originalTitle = details.title ?? details.name ?? null;
      overview = details.overview ?? null;
      posterPath = details.poster_path ?? null;
      backdropPath = details.backdrop_path ?? null;
    } else {
      const details = await tvmazeGetShow(externalId);
      tmdbId = details.id;
      title = details.name;
      overview = stripHtml(details.summary);
      releaseDate = parseDate(details.premiered);
      posterPath = details.image?.medium ?? details.image?.original ?? null;
      backdropPath = null;
      genres = details.genres ?? [];
    }

    // TODO: consider storing source-specific IDs once schema supports it.
    const savedTitle = await prisma.title.upsert({
      where: {
        tmdbId_mediaType: {
          tmdbId,
          mediaType,
        },
      },
      create: {
        tmdbId,
        mediaType,
        title,
        originalTitle,
        releaseDate,
        posterPath,
        backdropPath,
        overview,
        runtimeMinutes,
        genres,
      },
      update: {
        title,
        originalTitle,
        releaseDate,
        posterPath,
        backdropPath,
        overview,
        runtimeMinutes,
        genres,
      },
    });

    return NextResponse.json({
      ok: true,
      data: savedTitle,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upstream catalog error.";
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UPSTREAM_ERROR",
          message,
        },
      },
      { status: 502 }
    );
  }
}
