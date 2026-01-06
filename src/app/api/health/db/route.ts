import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[health/db] query failed", error);
    return NextResponse.json(
      { ok: false, error: "DB health check failed" },
      { status: 500 }
    );
  }
}
