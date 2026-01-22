"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export default function AuthNav() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { user: SessionUser | null };
        if (active) {
          setUser(payload.user ?? null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
          href="/me"
        >
          Profile
        </Link>
        <form action="/sign-out" method="post">
          <button
            className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
      href="/sign-in"
    >
      Sign in
    </Link>
  );
}
