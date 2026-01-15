import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  watchedOn: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  containsSpoilers: z.boolean().optional().default(false),
  liked: z.boolean().optional().default(false),
  body: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
});

function parseDate(value?: string): Date | null {
  if (!value) return null;
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

  const { tmdbId, mediaType, watchedOn, rating, containsSpoilers, liked, body: text, tags } =
    parsed.data;
  const date = parseDate(watchedOn);
  if (watchedOn && !date) {
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
          message: "Title not found. Hydrate the title before creating a review.",
        },
      },
      { status: 404 }
    );
  }

  const normalizedTags = Array.from(
    new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))
  );

  try {
    const created = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          titleId: title.id,
          watchedOn: date,
          rating: rating !== undefined ? new Prisma.Decimal(rating) : null,
          containsSpoilers,
          liked,
          body: text,
        },
      });

      if (normalizedTags.length > 0) {
        const tagRecords = await Promise.all(
          normalizedTags.map((name) =>
            tx.tag.upsert({
              where: { name },
              update: {},
              create: { name },
            })
          )
        );

        await tx.reviewTag.createMany({
          data: tagRecords.map((tag) => ({
            reviewId: review.id,
            tagId: tag.id,
          })),
        });
      }

      return review;
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review creation failed.";
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
