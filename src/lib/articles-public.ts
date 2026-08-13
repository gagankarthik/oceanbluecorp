// Server-side readers for the four public content sections.
//
// The public pages read DynamoDB directly rather than going through
// /api/articles, exactly as the careers pages read jobs directly: a server
// component calling its own HTTP API is a round trip through the network stack
// to reach code already running in the same process, and it loses the ISR
// caching the page segment would otherwise get.
//
// `isLive` is the ONLY definition of "published" (see lib/articles.ts), so a
// draft, an unapproved case study, or a piece scheduled for next Tuesday cannot
// reach a public page through here.

import { cache } from "react";
import type { Metadata } from "next";
import { getAllArticles, type Article, type ArticleKind } from "@/lib/aws/dynamodb";
import { ARTICLE_KIND_CONFIG, byNewest, isLive } from "@/lib/articles";
import { richTextToPlain } from "@/lib/rich-text";

export const SITE = "https://oceanbluecorp.com";

/**
 * Everything live in one section, featured first then newest.
 *
 * Wrapped in React's `cache()` because generateMetadata and the page component
 * both need it, which would otherwise be two table scans per request. Scoped to
 * a single render pass, so it is a de-dupe, not a stale cache.
 */
export const getLiveArticles = cache(async (kind: ArticleKind): Promise<Article[]> => {
  const result = await getAllArticles(kind);
  return (result.data || [])
    .filter((a) => isLive(a))
    .sort((a, b) => {
      // Featured pins to the top; within each group, newest first.
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      return byNewest(a, b);
    });
});

/**
 * One live piece by its public slug, or null.
 *
 * Reads through `getLiveArticles` so a page rendering both the article and its
 * "more from this section" list costs one scan, not two. Returning null rather
 * than throwing lets the page call notFound() itself, which is what turns an
 * unpublished slug into a 404 instead of a 500.
 */
export const getLiveArticle = cache(
  async (kind: ArticleKind, slug: string): Promise<Article | null> => {
    const all = await getLiveArticles(kind);
    return all.find((a) => a.slug === slug) ?? null;
  },
);

/** Other live pieces in the same section, newest first. */
export async function getRelatedArticles(
  kind: ArticleKind,
  excludeId: string,
  limit = 3,
): Promise<Article[]> {
  const all = await getLiveArticles(kind);
  return all.filter((a) => a.id !== excludeId).slice(0, limit);
}

// ── Metadata ─────────────────────────────────────────────────────────────────

/**
 * Metadata for a section index, with indexing decided by whether it holds
 * anything.
 *
 * The four sections shipped as "coming soon" pages carrying
 * `robots: { index: false }`, with a comment explaining why: four thin pages in
 * an index hurt the domain rather than help it, and the flag was to come off
 * "once real content lands". This is that, made automatic. An empty section
 * stays out of search; the first published piece lets it in, and nobody has to
 * remember to edit a file.
 */
export function sectionMetadata(
  kind: ArticleKind,
  base: { title: string; description: string },
  liveCount: number,
): Metadata {
  const url = `${SITE}${ARTICLE_KIND_CONFIG[kind].publicPath}`;
  return {
    title: base.title,
    description: base.description,
    openGraph: {
      title: `${base.title} | Ocean Blue Corporation`,
      description: base.description,
      url,
      type: "website",
    },
    alternates: { canonical: url },
    ...(liveCount === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Metadata for one published piece. */
export function articleMetadata(article: Article): Metadata {
  const config = ARTICLE_KIND_CONFIG[article.kind as ArticleKind];
  const url = `${SITE}${config.publicPath}/${article.slug}`;
  const title = article.seoTitle?.trim() || article.title;
  // The author's summary first; only fall back to chopping the body when they
  // left it blank, because this is the sentence that decides the click.
  const description =
    article.seoDescription?.trim() ||
    article.excerpt?.trim() ||
    richTextToPlain(article.body).slice(0, 200);
  const image = article.heroImageUrl;

  return {
    title,
    description,
    authors: article.authorName ? [{ name: article.authorName }] : undefined,
    openGraph: {
      title: `${title} | Ocean Blue Corporation`,
      description,
      url,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      ...(image ? { images: [{ url: image, alt: article.heroImageAlt || title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    // canonicalUrl is set when a piece was published elsewhere first; pointing
    // at the original is what stops the two competing in search.
    alternates: { canonical: article.canonicalUrl?.trim() || url },
    ...(article.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Article / NewsArticle structured data.
 *
 * Only fields we genuinely hold are emitted, the same rule the JobPosting
 * markup follows: padded or invented values are penalised, not rewarded.
 */
export function articleJsonLd(article: Article) {
  const config = ARTICLE_KIND_CONFIG[article.kind as ArticleKind];
  const url = `${SITE}${config.publicPath}/${article.slug}`;
  const publisher = {
    "@type": "Organization",
    name: "Ocean Blue Corporation",
    url: SITE,
  };

  return {
    "@context": "https://schema.org",
    "@type": article.kind === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    ...(article.subtitle ? { alternativeHeadline: article.subtitle } : {}),
    description: article.seoDescription?.trim() || article.excerpt?.trim() || undefined,
    ...(article.heroImageUrl ? { image: [article.heroImageUrl] } : {}),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    ...(article.authorName
      ? { author: { "@type": "Person", name: article.authorName, ...(article.authorRole ? { jobTitle: article.authorRole } : {}) } }
      : { author: publisher }),
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
  };
}
