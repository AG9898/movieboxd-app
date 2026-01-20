"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export function useRequireSession() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as { user: SessionUser | null };
        if (!response.ok) {
          throw new Error("Session fetch failed");
        }
        if (!active) return;
        if (!payload.user) {
          const search =
            typeof window === "undefined" || !window.location.search
              ? ""
              : window.location.search;
          const current = `${pathname}${search}`;
          router.replace(`/sign-in?next=${encodeURIComponent(current)}`);
          return;
        }
        setUser(payload.user);
      } catch {
        if (!active) return;
        const search =
          typeof window === "undefined" || !window.location.search
            ? ""
            : window.location.search;
        const current = `${pathname}${search}`;
        router.replace(`/sign-in?next=${encodeURIComponent(current)}`);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return { user, isLoading };
}
