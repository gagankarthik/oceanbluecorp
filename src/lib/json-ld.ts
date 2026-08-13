/**
 * Serialize JSON-LD for embedding in a <script> tag.
 *
 * JSON.stringify escapes quotes but NOT `<`, so a value containing
 * "</script>" would close the tag early and let the remainder be parsed as
 * markup, stored XSS by way of whatever admin form authored the text.
 * Escaping `<` (and the two JS line terminators, which are literal in JSON but
 * illegal inside a JS string literal) makes the payload inert while staying
 * valid JSON-LD.
 *
 * Lived in the careers job page until the article pages needed the same thing.
 * Every public page that emits structured data from authored content must use
 * this rather than a bare JSON.stringify.
 */
const LINE_SEPARATOR = " ";
const PARAGRAPH_SEPARATOR = " ";

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(`[${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, "g"), (c) =>
      c === LINE_SEPARATOR ? "\\u2028" : "\\u2029",
    );
}
