import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  privacy: z.enum(["public", "private", "friends"]).default("public"),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
      { status: 401 }
    );
  }

  const lists = await prisma.list.findMany({
    orderBy: { updatedAt: "desc" },
    where: { userId: user.id },
  });
  return NextResponse.json({ ok: true, data: lists });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required." } },
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

  const created = await prisma.list.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      privacy: parsed.data.privacy,
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true, data: created });
}
