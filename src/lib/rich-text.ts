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
