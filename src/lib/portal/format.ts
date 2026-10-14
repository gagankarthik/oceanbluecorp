// Small display helpers shared by portal views.

/**
 * A stored URL, only if it is http(s). Bare domains ("acme.com") get https://.
 * Anything else (javascript:, data:, garbage) returns null so it renders as text.
 */
export function safeHttpUrl(u: string | null | undefined): string | null {
  const raw = u?.trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
