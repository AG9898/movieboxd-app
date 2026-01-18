import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(1970).max(2100).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    month: url.searchParams.get("month") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
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

  const { month, year } = parsed.data;

  const [total, avgAggregate, yearCount, monthCount] = await Promise.all([
    prisma.diaryEntry.count(),
    prisma.diaryEntry.aggregate({
      _avg: { rating: true },
    }),
    year
      ? prisma.diaryEntry.count({
          where: {
            watchedOn: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1),
            },
          },
        })
      : Promise.resolve(0),
    month && year
      ? prisma.diaryEntry.count({
          where: {
            watchedOn: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        })
      : Promise.resolve(0),
  ]);

  const avgRatingRaw = avgAggregate._avg.rating;
  const avgRating = avgRatingRaw === null ? 0 : Number(avgRatingRaw);

  return NextResponse.json({
    ok: true,
    data: {
      total,
      yearCount,
      monthCount,
      avgRating,
    },
  });
}
