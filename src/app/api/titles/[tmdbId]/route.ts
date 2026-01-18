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
  const url = new URL(request.url);
  const pathId = params?.tmdbId ?? url.pathname.split("/").pop() ?? "";
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
