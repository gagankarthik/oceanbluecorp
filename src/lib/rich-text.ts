/**
 * Shared rich-text helpers. Kept dependency-free (no React, no lucide) so both
 * the admin editor and the PUBLIC careers page can import them without pulling
 * the editor's client bundle onto the marketing site.
 */

/** True when the string already carries HTML tags. */
export function isHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/**
 * Props for rendering stored description HTML on read-only surfaces (the job
 * form preview, the public job page). Values authored in the rich editor are
 * sanitized at SAVE time; legacy descriptions are plain text, so their newlines
 * are converted to <br> here to preserve line breaks.
 */
export function renderRichText(value: string | undefined | null): { __html: string } {
  if (!value) return { __html: "" };
  return { __html: isHtml(value) ? value : value.replace(/\n/g, "<br>") };
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Render a LIST field (requirements / responsibilities) to HTML. New records
 * store rich HTML; legacy records store a `string[]`, those become a <ul>.
 * Also used to SEED the rich editor from a legacy array.
 */
export function renderListField(value: string | string[] | undefined | null): { __html: string } {
  if (!value) return { __html: "" };
  if (Array.isArray(value)) {
    const items = value.map((s) => String(s).trim()).filter(Boolean);
    return { __html: items.length ? `<ul>${items.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>` : "" };
  }
  return renderRichText(value);
}

/** Coerce a rich-text-or-array field to PLAIN text, for JSON-LD, email text
 *  parts, search indexing. Strips tags from HTML; joins arrays. */
export function richTextToPlain(value: string | string[] | undefined | null): string {
  if (!value) return "";
  const raw = Array.isArray(value) ? value.join(" ") : value;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
