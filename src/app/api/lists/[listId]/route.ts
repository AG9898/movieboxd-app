import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  privacy: z.enum(["public", "private", "friends"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { listId: string } }
) {
  const list = await prisma.list.findUnique({
    where: { id: params.listId },
  });

  if (!list) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: list });
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
  const parsed = updateSchema.safeParse(body);

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
  const updated = await prisma.list.update({
    where: { id: listId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? undefined,
      privacy: parsed.data.privacy,
    },
  });

  return NextResponse.json({ ok: true, data: updated });
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

  const list = await prisma.list.findUnique({ where: { id: params.listId } });
  if (!list) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.listItem.deleteMany({ where: { listId: params.listId } }),
    prisma.list.delete({ where: { id: params.listId } }),
  ]);

  return NextResponse.json({ ok: true });
}
