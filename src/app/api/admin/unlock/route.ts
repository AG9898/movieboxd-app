import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const passphrase = String(formData.get("passphrase") ?? "");
  const nextPath = String(formData.get("next") ?? "/reviews");
  const expected = process.env.ADMIN_PASSPHRASE ?? "";

  if (!expected || passphrase !== expected) {
    const url = new URL("/admin/unlock", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set("ft_admin", expected, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
