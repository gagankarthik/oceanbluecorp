// Error responses for route handlers.
//
// A 500 body is read by a person, so it says what failed and what to do next.
// The cause (SDK text, table names, ARNs, stack) goes to the server log only:
// echoing it tells a caller nothing useful and tells an attacker a great deal.
// 400s are different, they name the field to fix and are meant to be shown.
import { NextResponse } from "next/server";

/** "save the client" -> "Couldn't save the client. Please try again." */
export function failureMessage(action: string): string {
  return `Couldn't ${action}. Please try again.`;
}

/** Logs `context` and the real cause, answers with `userMessage` only. */
export function serverError(
  context: string,
  cause: unknown,
  userMessage: string,
  status = 500,
): NextResponse {
  console.error(`[api] ${context}:`, cause);
  return NextResponse.json({ error: userMessage }, { status });
}

/** A 400 whose message tells the caller what to fix. */
export function badRequest(message: string, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ...extra, error: message }, { status: 400 });
}
