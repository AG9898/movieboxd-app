import { NextResponse } from "next/server";

import { tmdbSearch } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await tmdbSearch("matrix", "movie", 1);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[health/catalog] query failed", error);
    return NextResponse.json(
      { ok: false, error: "Catalog health check failed" },
      { status: 502 }
    );
  }
}
