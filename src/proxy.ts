import { type NextRequest, NextResponse } from "next/server";

// Routes that require a logged-in session
const PROTECTED_ADMIN_PATTERNS = [
  /^\/admin(\/.*)?$/,
  /^\/api\/admin\//,
  /^\/api\/users(\/.*)?$/,
];

// Public API routes (no auth required)
const PUBLIC_API_PATTERNS = [
  /^\/api\/jobs$/,
  /^\/api\/jobs\/[^/]+$/,
  /^\/api\/applications$/,
  /^\/api\/contacts$/,
  /^\/api\/auth\//,
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PATTERNS.some((p) => p.test(pathname));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_ADMIN_PATTERNS.some((p) => p.test(pathname));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block unauthenticated access to admin API routes
  if (pathname.startsWith("/api/admin/") || pathname.startsWith("/api/users")) {
    if (isPublicApi(pathname)) return NextResponse.next();

    // Require an Authorization header for admin API routes
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  // Redirect unauthenticated users away from /admin/* pages
  // (secondary guard — client-side AuthProvider is the primary guard)
  if (pathname.startsWith("/admin")) {
    const hasSession =
      request.cookies.has("amplify.sid") ||
      request.cookies.has("oidc.session") ||
      // Cognito OIDC stores state in storage keys prefixed with "oidc.user:"
      // We can't read localStorage in middleware but can check a lightweight
      // session cookie set by the auth callback if one is configured.
      request.cookies.has("ob.auth");

    if (!hasSession) {
      // Let the client-side ProtectedRoute handle the redirect instead of
      // hard-redirecting here, to avoid a flash on page refresh for valid users.
      // This middleware only handles the request headers/security layer.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)).*)",
  ],
};
