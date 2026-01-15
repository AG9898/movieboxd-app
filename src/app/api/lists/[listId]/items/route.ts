import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  rank: z.number().int().min(1),
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
  note: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { listId: string } }
) {
  const items = await prisma.listItem.findMany({
    where: { listId: params.listId },
    orderBy: { rank: "asc" },
    include: {
      title: true,
    },
  });

  return NextResponse.json({ ok: true, data: items });
}

export async function POST(
  request: Request,
  { params }: { params: { listId: string } }
) {
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

  const { listId } = params;
  const { tmdbId, mediaType, rank, note } = parsed.data;

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
      { status: 404 }
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

  const created = await prisma.listItem.create({
    data: {
      listId,
      titleId: title.id,
      rank,
      note: note?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, data: created });
}

export async function PUT(
  request: Request,
  { params }: { params: { listId: string } }
) {
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
    const listItem = await prisma.listItem.findUnique({ where: { id } });
    if (!listItem || listItem.listId !== params.listId) {
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

  const { listId } = params;
  const items = parsed.data.items;

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
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

export async function DELETE(
  request: Request,
  { params }: { params: { listId: string } }
) {
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
  const listItem = await prisma.listItem.findUnique({ where: { id } });

  if (!listItem || listItem.listId !== params.listId) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List item not found." } },
      { status: 404 }
    );
  }

  await prisma.listItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
