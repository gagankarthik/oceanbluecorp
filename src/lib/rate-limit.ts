// Rate limiting for the routes that have no authentication.
//
// `POST /api/applications` and `POST /api/resume/upload` are open by design —
// the public careers form posts through both — which means anyone can drive them
// in a loop: S3 objects, DynamoDB rows, an LLM extraction pipeline and an
// outbound email per iteration. That is a cost attack and a deliverability
// attack in one, and it is the likeliest route to another sending shutdown.
//
// WHY DYNAMODB AND NOT A MAP
//
// The obvious in-memory counter does almost nothing here: each Lambda instance
// gets its own memory, Amplify runs several, and a cold start resets the count.
// It would report protection it does not provide. A counter in the shared
// counters table is the same window for every instance, costs one write, and is
// what makes the limit real.
//
// FAILING OPEN
//
// If the counter cannot be read or written, the request is ALLOWED. A limiter
// that is down must never be the reason a genuine applicant cannot apply — the
// failure mode of blocking real candidates is worse than the failure mode of
// briefly not throttling an attacker.
import { NextResponse } from "next/server";
import { incrementRateCounter } from "@/lib/aws/dynamodb";

export interface RateLimitRule {
  /** Distinguishes one limited action from another in the counter key. */
  action: string;
  /** Requests allowed per window, per client. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/**
 * Best guess at the caller, from the proxy headers Amplify/CloudFront set.
 *
 * `x-forwarded-for` is client-controlled in principle, so the LEFTMOST entry is
 * taken only as a bucket key, never as an identity. A caller who forges it just
 * spreads their own traffic across buckets — which is why the limits below are
 * per-IP but deliberately not the only protection.
 */
export function clientKey(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0] : "").trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown";
  return ip.slice(0, 45); // an IPv6 address at its longest
}

export interface RateLimitResult {
  allowed: boolean;
  /** Populated only when the caller is over the limit. */
  response?: NextResponse;
}

/**
 * Count this request against `rule` and say whether it may proceed.
 *
 * Fixed window rather than a sliding one: a burst at a window boundary can pass
 * up to twice the limit, which is an acceptable trade for a single atomic
 * increment and no extra reads.
 */
export async function checkRateLimit(
  request: Request,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const key = clientKey(request);
  const window = Math.floor(Date.now() / 1000 / rule.windowSeconds);
  const counterId = `rl#${rule.action}#${key}#${window}`;
  // Long enough that a stale row cannot be reused, short enough to be cleaned up.
  const expiresAt = (window + 2) * rule.windowSeconds;

  const count = await incrementRateCounter(counterId, expiresAt);
  if (count === null) return { allowed: true }; // limiter unavailable: fail open

  if (count > rule.limit) {
    const retryAfter = rule.windowSeconds - (Math.floor(Date.now() / 1000) % rule.windowSeconds);
    console.warn(`[rate-limit] ${rule.action} blocked for ${key}: ${count} in ${rule.windowSeconds}s`);
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      ),
    };
  }

  return { allowed: true };
}

/**
 * The limits themselves.
 *
 * Sized so a real person filling in a form never notices, and a script does
 * immediately. A candidate submits one application and uploads one or two
 * resumes; nobody legitimately posts five applications a minute from one address.
 */
export const RATE_LIMITS = {
  /** Public job application. */
  application: { action: "apply", limit: 5, windowSeconds: 60 } as RateLimitRule,
  /** Public resume upload — heavier, since each one writes to S3. */
  resumeUpload: { action: "resume-upload", limit: 10, windowSeconds: 300 } as RateLimitRule,
  /**
   * Public contact form.
   *
   * Tighter than an application because each submission costs more on the way
   * out: a contacts row, an in-app notification, AND an SES email to the team.
   * The route already carries a honeypot field and a submit-timing check, but
   * both are trivially defeated by anything that reads the form before posting
   * to it — leave the decoy input empty, wait three seconds, and you are through.
   * A real person sends one of these; three in five minutes is already generous.
   */
  contact: { action: "contact", limit: 3, windowSeconds: 300 } as RateLimitRule,
} as const;
