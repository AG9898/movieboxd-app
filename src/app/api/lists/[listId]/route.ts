import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  privacy: z.enum(["public", "private", "friends"]).optional(),
});

type RouteContext = { params: Promise<{ listId: string }> };

async function resolveListId(request: NextRequest, context: RouteContext) {
  const url = new URL(request.url);
  const params = await context.params;
  return z
    .string()
    .uuid()
    .safeParse(params?.listId ?? url.pathname.split("/").pop());
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

  const list = await prisma.list.findUnique({
    where: { id: listIdResult.data },
  });

  if (!list) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
      { status: 404 }
    );
  }

  if (list.userId !== user.id) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Not allowed." } },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, data: list });
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

  const existing = await prisma.list.findUnique({ where: { id: listIdResult.data } });
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
      { status: 404 }
    );
  }
  if (existing.userId !== user.id) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Not allowed." } },
      { status: 403 }
    );
  }

  const updated = await prisma.list.update({
    where: { id: listIdResult.data },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? undefined,
      privacy: parsed.data.privacy,
    },
  });

  return NextResponse.json({ ok: true, data: updated });
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

  const list = await prisma.list.findUnique({ where: { id: listIdResult.data } });
  if (!list) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "List not found." } },
      { status: 404 }
    );
  }

  if (list.userId !== user.id) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Not allowed." } },
      { status: 403 }
    );
  }

  await prisma.$transaction([
    prisma.listItem.deleteMany({ where: { listId: listIdResult.data } }),
    prisma.list.delete({ where: { id: listIdResult.data } }),
  ]);

  return NextResponse.json({ ok: true });
}
