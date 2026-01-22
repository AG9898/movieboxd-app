import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { NextResponse } from "next/server";

function clearSessionAndRedirect(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}

export function GET(request: Request) {
  return clearSessionAndRedirect(request);
}

export function POST(request: Request) {
  return clearSessionAndRedirect(request);
}
