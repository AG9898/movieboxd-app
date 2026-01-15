import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  const titles = await prisma.title.findMany({
    where: query
      ? {
          title: {
            contains: query,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return NextResponse.json({ ok: true, data: titles });
}
