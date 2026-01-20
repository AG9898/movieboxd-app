import "server-only";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "mbd_session";
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

type SessionPayload = {
  id: string;
  email: string;
};

export function encodeSessionUser(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeSessionUser(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(decoded) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  const payload = decodeSessionUser(raw);
  if (!payload?.id) {
    return null;
  }

  try {
    const user = await prisma.authUser.findUnique({
      where: { id: payload.id },
      include: { profile: true },
    });

    if (!user || user.email !== payload.email) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.profile?.displayName ?? null,
    };
  } catch {
    return null;
  }
}
