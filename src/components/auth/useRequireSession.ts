"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export function useRequireSession() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
          const current = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
          router.replace(`/sign-in?next=${encodeURIComponent(current)}`);
          return;
        }
        setUser(payload.user);
      } catch {
        if (!active) return;
        const current = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
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
  }, [pathname, router, searchParams]);

  return { user, isLoading };
}
