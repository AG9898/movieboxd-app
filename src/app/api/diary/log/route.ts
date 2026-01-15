import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  watchedOn: z.string(),
  rating: z.number().min(0).max(5).optional(),
  liked: z.boolean().optional().default(false),
  rewatch: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Admin required." } },
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

  const { tmdbId, mediaType, watchedOn, rating, liked, rewatch, notes } =
    parsed.data;
  const date = parseDate(watchedOn);
  if (!date) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "watchedOn must be a valid date." },
      },
      { status: 400 }
    );
  }

  const title = await prisma.title.findUnique({
    where: { tmdbId_mediaType: { tmdbId, mediaType } },
  });

  if (!title) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Title not found. Hydrate the title before logging a diary entry.",
        },
      },
      { status: 404 }
    );
  }

  try {
    const created = await prisma.diaryEntry.create({
      data: {
        titleId: title.id,
        watchedOn: date,
        rating: rating !== undefined ? new Prisma.Decimal(rating) : null,
        liked,
        rewatch,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Diary log failed.";
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
