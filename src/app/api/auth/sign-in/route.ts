import { encodeSessionUser, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function resolveNextPath(raw: FormDataEntryValue | null) {
  const nextPath = typeof raw === "string" ? raw : "";
  return nextPath.startsWith("/") ? nextPath : "/me";
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/sign-in", request.url), 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = resolveNextPath(formData.get("next"));

  if (!email || !password) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url), 303);
    return response;
  }

  try {
    const user = await prisma.authUser.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.redirect(new URL("/sign-in?error=invalid", request.url), 303);
    }

    const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
    response.cookies.set(
      SESSION_COOKIE_NAME,
      encodeSessionUser({ id: user.id, email: user.email }),
      SESSION_COOKIE_OPTIONS
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=server", request.url), 303);
  }
}
