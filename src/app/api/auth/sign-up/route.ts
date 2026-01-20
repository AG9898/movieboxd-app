import { encodeSessionUser, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function resolveNextPath(raw: FormDataEntryValue | null) {
  const nextPath = typeof raw === "string" ? raw : "";
  return nextPath.startsWith("/") ? nextPath : "/me";
}

function normalizeUsername(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return base || "movieboxd-user";
}

async function ensureUniqueUsername(seed: string) {
  let candidate = normalizeUsername(seed);
  let suffix = 1;
  while (true) {
    const existing = await prisma.userProfile.findUnique({ where: { username: candidate } });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${normalizeUsername(seed)}-${suffix}`;
  }
}

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/sign-up", request.url), 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = resolveNextPath(formData.get("next"));

  if (!email || !password) {
    const response = NextResponse.redirect(new URL("/sign-up", request.url), 303);
    return response;
  }

  try {
    const existing = await prisma.authUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.redirect(new URL("/sign-in?error=exists", request.url), 303);
    }

    const passwordHash = hashPassword(password);
    const usernameSeed = name || email.split("@")[0];
    const username = await ensureUniqueUsername(usernameSeed);

    const user = await prisma.authUser.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            username,
            displayName: name || null,
          },
        },
      },
      include: { profile: true },
    });

    const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
    response.cookies.set(
      SESSION_COOKIE_NAME,
      encodeSessionUser({ id: user.id, email: user.email }),
      SESSION_COOKIE_OPTIONS
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/sign-up?error=server", request.url), 303);
  }
}
