import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ reviewId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const url = new URL(request.url);
  const fallbackId = url.pathname.split("/").filter(Boolean).pop();
  const params = await context.params;
  const reviewId = params?.reviewId ?? fallbackId;
  if (!reviewId || reviewId === "reviews" || reviewId === "api") {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Missing review id." } },
      { status: 400 }
    );
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      title: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!review) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Review not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: review.id,
      title: {
        tmdbId: review.title.tmdbId,
        mediaType: review.title.mediaType,
        title: review.title.title,
        releaseDate: review.title.releaseDate,
        posterPath: review.title.posterPath,
        backdropPath: review.title.backdropPath,
      },
      watchedOn: review.watchedOn,
      rating: review.rating === null ? null : Number(review.rating),
      containsSpoilers: review.containsSpoilers,
      liked: review.liked,
      body: review.body,
      tags: review.tags.map((entry) => entry.tag.name),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    },
  });
}
