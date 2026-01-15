import "server-only";

function jsonUnauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, error: "ADMIN_REQUIRED" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function requireAdmin(request: Request): void {
  if (process.env.PUBLIC_READONLY === "false") {
    return;
  }

  const passphrase = request.headers.get("x-admin-passphrase");
  const expected = process.env.ADMIN_PASSPHRASE;

  if (!passphrase || !expected || passphrase !== expected) {
    throw jsonUnauthorized();
  }
}
