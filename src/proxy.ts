import { type NextRequest, NextResponse } from "next/server";

// Auth is handled client-side via Cognito OIDC (tokens in localStorage).
// The proxy cannot read localStorage, so API auth guards must live inside
// the individual API route handlers — not here.
// This proxy exists solely to set security response headers via next.config.ts
// and to provide the matcher so Next.js instruments the correct routes.

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)).*)",
  ],
};
