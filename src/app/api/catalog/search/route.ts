import { NextResponse } from "next/server";
import { z } from "zod";

import { catalogSearch } from "@/lib/catalog";
import { isRateLimited, SEARCH_RATE_LIMIT } from "@/lib/rateLimit";

const querySchema = z.object({
  q: z.string().min(2, "q must be at least 2 characters."),
  type: z.enum(["movie", "tv", "multi"]).default("multi"),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip, SEARCH_RATE_LIMIT)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
        },
      },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    type: url.searchParams.get("type") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
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

  try {
    const { q, type, page } = parsed.data;
    const result = await catalogSearch({ q, type, page });
    return NextResponse.json({
      ok: true,
      data: {
        results: result.results,
      },
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
