import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [titles, diaryEntries, reviews, lists] = await Promise.all([
      prisma.title.count(),
      prisma.diaryEntry.count(),
      prisma.review.count(),
      prisma.list.count(),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        titles,
        diaryEntries,
        reviews,
        lists,
      },
    });
  } catch (error) {
    console.error("[health/db-stats] query failed", error);
    return NextResponse.json(
      { ok: false, error: "DB stats check failed" },
      { status: 500 }
    );
  }
}
