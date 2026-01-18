import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/reviews", "/review", "/lists", "/track"];

function needsProtection(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  if (process.env.PUBLIC_READONLY === "false") {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/admin/unlock")) {
    return NextResponse.next();
  }

  if (!needsProtection(pathname)) {
    return NextResponse.next();
  }

  const expected = process.env.ADMIN_PASSPHRASE;
  const cookiePassphrase = request.cookies.get("ft_admin")?.value;
  if (expected && cookiePassphrase === expected) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/admin/unlock";
  redirectUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/reviews", "/track", "/review/:path*", "/lists/:path*"],
};
