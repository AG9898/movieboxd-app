import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const querySchema = z.object({
  mediaType: z.enum(["movie", "tv"]).default("movie"),
});

export async function GET(
  request: Request,
  { params }: { params: { tmdbId: string } }
) {
  const tmdbId = Number(params.tmdbId);
  if (Number.isNaN(tmdbId)) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid tmdbId." } },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
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

  const title = await prisma.title.findUnique({
    where: {
      tmdbId_mediaType: {
        tmdbId,
        mediaType: parsed.data.mediaType,
      },
    },
  });

  if (!title) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Title not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: title });
}
