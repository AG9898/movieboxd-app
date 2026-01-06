import { NextResponse } from "next/server";

import { securityHeaders } from "@/lib/securityHeaders";

export function middleware() {
  const response = NextResponse.next();
  const headers = securityHeaders();

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
