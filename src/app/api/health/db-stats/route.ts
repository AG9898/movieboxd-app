import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in required" },
        { status: 401 }
      );
    }

    const [titles, reviews, lists] = await Promise.all([
      prisma.title.count(),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.list.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        titles,
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
