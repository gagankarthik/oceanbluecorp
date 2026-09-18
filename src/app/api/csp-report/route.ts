import { NextRequest, NextResponse } from "next/server";

/**
 * Content-Security-Policy violation sink. Browsers post here without
 * credentials, so it is deliberately unguarded (STANDARDS §5.1). It only logs:
 * nothing is stored, bodies are size-capped, and logging is capped per
 * instance so a noisy page or a flood can't fill the logs.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_LOGS_PER_MINUTE = 60;
let windowStart = 0;
let loggedInWindow = 0;

type Violation = {
  documentURL?: string;
  blockedURL?: string;
  effectiveDirective?: string;
  disposition?: string;
  sourceFile?: string;
  lineNumber?: number;
};

const clip = (v: unknown, n = 300) => (typeof v === "string" ? v.slice(0, n) : undefined);

/** Normalises the legacy `report-uri` body and the Reporting API array. */
function toViolations(payload: unknown): Violation[] {
  const reports = Array.isArray(payload) ? payload : [payload];
  return reports.slice(0, 20).flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const legacy = (r as Record<string, unknown>)["csp-report"] as Record<string, unknown> | undefined;
    const body = legacy ?? ((r as Record<string, unknown>).body as Record<string, unknown> | undefined);
    if (!body || typeof body !== "object") return [];
    return [{
      documentURL: clip(body.documentURL ?? body["document-uri"]),
      blockedURL: clip(body.blockedURL ?? body["blocked-uri"]),
      effectiveDirective: clip(body.effectiveDirective ?? body["effective-directive"] ?? body["violated-directive"], 80),
      disposition: clip(body.disposition, 20),
      sourceFile: clip(body.sourceFile ?? body["source-file"]),
      lineNumber: typeof (body.lineNumber ?? body["line-number"]) === "number" ? Number(body.lineNumber ?? body["line-number"]) : undefined,
    }];
  });
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });
    payload = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    loggedInWindow = 0;
  }
  for (const v of toViolations(payload)) {
    if (loggedInWindow >= MAX_LOGS_PER_MINUTE) break;
    loggedInWindow += 1;
    console.warn("[csp]", JSON.stringify(v));
  }

  return new NextResponse(null, { status: 204 });
}
