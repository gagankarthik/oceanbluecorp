// Server-only helpers shared by the two /api/articles handlers.
//
// Separate from lib/articles.ts because these touch `next/cache` and the HTML
// sanitizer, neither of which may be pulled into a client bundle, while
// lib/articles.ts is imported by the admin screens.

import { revalidatePath } from "next/cache";
import type { Article, ArticleKind } from "@/lib/aws/dynamodb";
import { sanitizeRichText } from "@/lib/sanitize-server";
import { ARTICLE_HTML_FIELDS, ARTICLE_KIND_CONFIG } from "@/lib/articles";

/**
 * Sanitize every rich-text field on a piece.
 *
 * Authored HTML is cleaned at SAVE time, not at render time, because these
 * fields are rendered with dangerouslySetInnerHTML on the public site (§5.6).
 * The editor also sanitizes client-side, but that is UX, a request can POST
 * anything, so this is the boundary that actually holds.
 */
export function sanitizeArticleHtml<T extends Partial<Article>>(input: T): T {
  for (const field of ARTICLE_HTML_FIELDS) {
    if (input[field]) input[field] = sanitizeRichText(input[field]) as T[typeof field];
  }
  return input;
}

/**
 * Push an edit live now rather than at the next ISR window.
 *
 * Best-effort: the public pages revalidate on their own schedule regardless, so
 * a failure here delays a change by the ISR interval, it never loses one.
 */
export function revalidateSection(kind: ArticleKind, slug?: string): void {
  try {
    const base = ARTICLE_KIND_CONFIG[kind].publicPath;
    revalidatePath(base);
    if (slug) revalidatePath(`${base}/${slug}`);
  } catch {
    // ISR is the fallback.
  }
}
