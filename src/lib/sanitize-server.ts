import sanitizeHtml from "sanitize-html";

/**
 * Server-side HTML sanitizer, the ENFORCEMENT boundary for rich text.
 *
 * The admin rich editor sanitizes on the client too, but that is only UX: a
 * request can POST arbitrary HTML straight to the job API. Since job
 * descriptions are rendered with dangerouslySetInnerHTML on the PUBLIC careers
 * page, every save must pass through here so the stored value is provably safe
 * regardless of how it arrived. Whitelist matches exactly what the editor can
 * produce (bold/italic/underline/lists/links), everything else is stripped.
 */
export function sanitizeRichText(value: string | null | undefined): string {
  if (!value) return "";
  return sanitizeHtml(value, {
    allowedTags: ["b", "strong", "i", "em", "u", "s", "p", "br", "ul", "ol", "li", "a", "span", "div"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    // Force safe link behaviour; drops javascript:/data: URLs (not in the scheme
    // allow-list) and any on* handlers (never allowed as attributes above).
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
    },
  });
}
