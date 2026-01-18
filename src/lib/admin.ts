import "server-only";

function jsonUnauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, error: "ADMIN_REQUIRED" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return rest.join("=") || null;
    }
  }
  return null;
}

export function requireAdmin(request: Request): void {
  if (process.env.PUBLIC_READONLY === "false") {
    return;
  }

  const passphrase = request.headers.get("x-admin-passphrase");
  const cookiePassphrase = getCookieValue(request.headers.get("cookie"), "ft_admin");
  const expected = process.env.ADMIN_PASSPHRASE;

  const hasMatch =
    !!expected &&
    ((passphrase && passphrase === expected) ||
      (cookiePassphrase && cookiePassphrase === expected));

  if (!hasMatch) {
    throw jsonUnauthorized();
  }
}
