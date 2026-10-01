import { type NextRequest, NextResponse } from "next/server";
import { getMaintenance } from "@/lib/content";

// Auth is not handled here: tokens live in localStorage, which a proxy cannot
// read, so every API route guards itself. Security headers come from
// next.config.ts. This file does one thing: while maintenance mode is on,
// public pages answer 503 with Retry-After, so a crawler reads the downtime as
// temporary and keeps the indexed pages instead of indexing the notice.

const RETRY_AFTER_SECONDS = "3600";
const FLAG_TTL_MS = 30_000;
const FLAG_TIMEOUT_MS = 1_500;

// Stays reachable while the switch is on: the console that turns it off,
// sign-in, the API, the preview of the screen itself, and the status page the
// screen links to.
const EXEMPT = ["/admin", "/auth", "/api", "/maintenance", "/status", "/manifest.webmanifest"];

let flag = { on: false, at: 0 };

/**
 * One lookup per instance every 30s, not one per request. Fails open: an error
 * or a slow read counts as "not in maintenance", because a switch whose job is
 * taking the site down must never do it by accident.
 */
async function maintenanceOn(): Promise<boolean> {
  if (Date.now() - flag.at < FLAG_TTL_MS) return flag.on;
  flag = { on: flag.on, at: Date.now() }; // concurrent requests reuse the last answer
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), FLAG_TIMEOUT_MS));
    const result = await Promise.race([getMaintenance(), timeout]);
    flag = { on: Boolean(result?.enabled), at: Date.now() };
  } catch {
    flag = { on: false, at: Date.now() };
  }
  return flag.on;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  if (EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (!(await maintenanceOn())) return NextResponse.next();

  return NextResponse.rewrite(new URL("/maintenance", request.url), {
    status: 503,
    headers: { "Retry-After": RETRY_AFTER_SECONDS, "Cache-Control": "no-store" },
  });
}

export const config = {
  matcher: [
    // Pages only. robots.txt and sitemap.xml are left out on purpose: a 503 on
    // robots.txt makes a crawler stop fetching the whole site.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|woff2?|ttf|otf|css|js)).*)",
  ],
};
