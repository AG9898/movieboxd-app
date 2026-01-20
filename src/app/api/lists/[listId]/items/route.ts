import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  rank: z.number().int().min(1).optional(),
  note: z.string().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      rank: z.number().int().min(1),
    })
  ),
});

const updateSchema = z.object({
  id: z.string().min(1),
  note: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ listId: string }> };

async function resolveListId(request: NextRequest, context: RouteContext) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const params = await context.params;
  return z
    .string()
    .uuid()
    .safeParse(params?.listId ?? segments[segments.length - 2]);
}

async function ensureListAccess(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    return { ok: false as const, status: 404, message: "List not found." };
  }
  if (list.userId !== userId) {
    return { ok: false as const, status: 403, message: "Not allowed." };
  }
  return { ok: true as const, list };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const listIdResult = await resolveListId(request, context);
  if (!listIdResult.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid listId." } },
      { status: 400 }
    );
  }

  const listAccess = await ensureListAccess(listIdResult.data, user.id);
  if (!listAccess.ok) {
    return NextResponse.json(
      { ok: false, error: { code: listAccess.status === 403 ? "FORBIDDEN" : "NOT_FOUND", message: listAccess.message } },
      { status: listAccess.status }
    );
  }

  const items = await prisma.listItem.findMany({
    where: { listId: listIdResult.data },
    orderBy: { rank: "asc" },
    include: {
      title: {
        include: {
          reviews: {
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    data: items.map((item) => ({
      id: item.id,
      rank: item.rank,
      note: item.note,
      title: {
        tmdbId: item.title.tmdbId,
        mediaType: item.title.mediaType,
        title: item.title.title,
        releaseDate: item.title.releaseDate,
        posterPath: item.title.posterPath,
      },
      latestReview: item.title.reviews[0]
        ? {
            id: item.title.reviews[0].id,
            rating:
              item.title.reviews[0].rating === null
                ? null
                : Number(item.title.reviews[0].rating),
            watchedOn: item.title.reviews[0].watchedOn,
            createdAt: item.title.reviews[0].createdAt,
          }
        : null,
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const listIdResult = await resolveListId(request, context);
  if (!listIdResult.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid listId." } },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

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

  const { tmdbId, mediaType, rank, note } = parsed.data;

  const listAccess = await ensureListAccess(listIdResult.data, user.id);
  if (!listAccess.ok) {
    return NextResponse.json(
      { ok: false, error: { code: listAccess.status === 403 ? "FORBIDDEN" : "NOT_FOUND", message: listAccess.message } },
      { status: listAccess.status }
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
          message: "Title not found. Hydrate the title before adding it to a list.",
        },
      },
      { status: 404 }
    );
  }

  const resolvedRank = await (async () => {
    if (rank) return rank;
    const aggregate = await prisma.listItem.aggregate({
      where: { listId: listIdResult.data },
      _max: { rank: true },
    });
    return (aggregate._max.rank ?? 0) + 1;
  })();

  const created = await prisma.listItem.create({
    data: {
      listId: listIdResult.data,
      titleId: title.id,
      rank: resolvedRank,
      note: note?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, data: created });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const listIdResult = await resolveListId(request, context);
  if (!listIdResult.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid listId." } },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    const updateParsed = updateSchema.safeParse(body);
    if (!updateParsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid request body.",
            details: updateParsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { id, note } = updateParsed.data;
    const listAccess = await ensureListAccess(listIdResult.data, user.id);
    if (!listAccess.ok) {
      return NextResponse.json(
        { ok: false, error: { code: listAccess.status === 403 ? "FORBIDDEN" : "NOT_FOUND", message: listAccess.message } },
        { status: listAccess.status }
      );
    }

    const listItem = await prisma.listItem.findUnique({ where: { id } });
    if (!listItem || listItem.listId !== listIdResult.data) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "List item not found." } },
        { status: 404 }
      );
    }

    const updated = await prisma.listItem.update({
      where: { id },
      data: { note: note?.trim() || null },
    });

    return NextResponse.json({ ok: true, data: updated });
  }

  const items = parsed.data.items;

  const listAccess = await ensureListAccess(listIdResult.data, user.id);
  if (!listAccess.ok) {
    return NextResponse.json(
      { ok: false, error: { code: listAccess.status === 403 ? "FORBIDDEN" : "NOT_FOUND", message: listAccess.message } },
      { status: listAccess.status }
    );
  }

  const existingItems = await prisma.listItem.findMany({
    where: {
      id: { in: items.map((item) => item.id) },
      listId: listIdResult.data,
    },
    select: { id: true },
  });
  if (existingItems.length !== items.length) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "One or more list items not found." } },
      { status: 404 }
    );
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.listItem.update({
        where: { id: item.id },
        data: { rank: item.rank },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const listIdResult = await resolveListId(request, context);
  if (!listIdResult.success) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid listId." } },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().min(1) }).safeParse(body);

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

  const { id } = parsed.data;
  const listAccess = await ensureListAccess(listIdResult.data, user.id);
  if (!listAccess.ok) {
    return NextResponse.json(
      { ok: false, error: { code: listAccess.status === 403 ? "FORBIDDEN" : "NOT_FOUND", message: listAccess.message } },
      { status: listAccess.status }
    );
  }

  const listItem = await prisma.listItem.findUnique({ where: { id } });

  if (!listItem || listItem.listId !== listIdResult.data) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List item not found." } },
      { status: 404 }
    );
  }

  await prisma.listItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
