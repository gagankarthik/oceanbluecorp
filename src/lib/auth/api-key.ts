// Guard for the partner-facing v1 API, the key-authenticated counterpart to
// verify.ts.
//
// Both v1 routes carried their own copy of this: same lookup, same three error
// strings, and the scope check would have had to be added to each. One guard,
// called the way `requireStaff` is, so a new v1 route cannot ship with a
// slightly different idea of what a valid key is.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getApiKeyByValue, updateApiKey, type ApiKey } from "@/lib/aws/dynamodb";
import { hasScope, type ApiScope } from "@/lib/api-scopes";

export type ApiKeyGuard =
  | { ok: true; key: ApiKey }
  | { ok: false; response: NextResponse };

const deny = (message: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error: message, ...extra }, { status });

/**
 * Resolve the caller's API key and assert it holds `scope`.
 *
 * The header is the documented way in; the query parameter stays supported
 * because /developers tells people to use it for a quick curl. Keep it to GET
 * in practice — a secret in a URL ends up in access logs.
 */
export async function requireApiKey(request: NextRequest, scope: ApiScope): Promise<ApiKeyGuard> {
  const presented =
    request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key");
  if (!presented) {
    return { ok: false, response: deny("Missing API key. Pass X-API-Key header.", 401) };
  }

  const result = await getApiKeyByValue(presented);
  if (!result.success || !result.data) {
    return { ok: false, response: deny("Invalid API key.", 401) };
  }
  if (!result.data.isActive) {
    return { ok: false, response: deny("API key is disabled.", 403) };
  }
  if (!hasScope(result.data, scope)) {
    // Name the scope. A 403 that only says "forbidden" sends a partner to
    // support to find out their key is read-only.
    return {
      ok: false,
      response: deny(`This API key does not have the "${scope}" scope.`, 403, { requiredScope: scope }),
    };
  }

  // Fire-and-forget: a slow write on the usage stamp must not delay the feed,
  // and a failed one must not fail an otherwise valid request.
  updateApiKey(result.data.id, { lastUsedAt: new Date().toISOString() }).catch(() => {});

  return { ok: true, key: result.data };
}
