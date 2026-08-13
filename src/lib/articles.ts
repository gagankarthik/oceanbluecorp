// The editorial model behind /blog, /case-studies, /news and /customer-stories.
//
// Pure: no AWS SDK, no React, so the admin screens, the route handlers and the
// public pages all read the same rules rather than each deciding for itself what
// "published" means or how a slug is built.
//
// The four sections are ONE record type with a `kind` (see the ARTICLES section
// in lib/aws/dynamodb.ts). What differs between them is not the storage, it is
// the editorial form, and that is what this file describes: which fields a kind
// actually uses, what a finished piece of that kind looks like, and what must be
// true before it can go out. The house-style skeletons live next door in
// lib/editorial.ts.

import type { Article, ArticleKind, ArticleMetric, ArticleStatus } from "@/lib/aws/dynamodb";
import type { Schema } from "@/lib/validate";
import type { Tone } from "@/components/admin/theme";

// ── Kinds ────────────────────────────────────────────────────────────────────

/** Optional field groups a kind can switch on in the editor. */
export type ArticleSection = "engagement" | "story" | "metrics" | "quote" | "press";

export interface ArticleKindConfig {
  kind: ArticleKind;
  /** Singular, sentence case: "case study". */
  noun: string;
  /** Plural, used for page titles and record counts. */
  plural: string;
  /** Title case, for the sidebar and the page heading. */
  label: string;
  /** One line on what belongs in this section and what does not. */
  purpose: string;
  adminPath: string;
  publicPath: string;
  sections: ArticleSection[];
  /** Offered in the Category picker. Empty means the kind has no categories. */
  categories: string[];
}

/**
 * The four sections, in the order a marketing team fills them.
 *
 * The split is not cosmetic. A case study is a first-person account of work WE
 * did and is argued with numbers; a customer story is the client's own account
 * and is carried by a quote; news is a dated announcement in press-release form
 * that journalists expect to be able to lift verbatim; a blog post is the only
 * one of the four with no external party to clear. Collapsing any two of them
 * loses a rule that matters, which is why each carries its own field set and its
 * own checklist rather than sharing one "post" form.
 */
export const ARTICLE_KIND_CONFIG: Record<ArticleKind, ArticleKindConfig> = {
  blog: {
    kind: "blog",
    noun: "post",
    plural: "posts",
    label: "Blog",
    purpose:
      "What we know, written by the person who knows it. Useful to a reader who never buys from us.",
    adminPath: "/admin/blog",
    publicPath: "/blog",
    sections: [],
    categories: [
      "Hiring & Talent",
      "Engineering",
      "Enterprise Platforms",
      "Compliance",
      "Industry Analysis",
      "Inside Ocean Blue",
    ],
  },
  "case-study": {
    kind: "case-study",
    noun: "case study",
    plural: "case studies",
    label: "Case Studies",
    purpose:
      "One engagement, told as challenge → approach → results, with figures a buyer can check.",
    adminPath: "/admin/case-studies",
    publicPath: "/case-studies",
    sections: ["engagement", "story", "metrics", "quote"],
    categories: [
      "Contract Staffing",
      "Direct Hire",
      "Managed Teams",
      "Enterprise Platforms",
      "Cloud & Infrastructure",
      "Data & Analytics",
    ],
  },
  news: {
    kind: "news",
    noun: "announcement",
    plural: "announcements",
    label: "News",
    purpose:
      "Dated company announcements in press-release form, written so a journalist can quote them unedited.",
    adminPath: "/admin/news",
    publicPath: "/news",
    sections: ["press"],
    categories: [],
  },
  "customer-story": {
    kind: "customer-story",
    noun: "customer story",
    plural: "customer stories",
    label: "Customer Stories",
    purpose:
      "The client's account in their own words, led by a quote. Shorter and warmer than a case study.",
    adminPath: "/admin/customer-stories",
    publicPath: "/customer-stories",
    sections: ["engagement", "metrics", "quote"],
    categories: [],
  },
};

export const ARTICLE_KINDS = Object.keys(ARTICLE_KIND_CONFIG) as ArticleKind[];

export const isArticleKind = (value: unknown): value is ArticleKind =>
  typeof value === "string" && (ARTICLE_KINDS as string[]).includes(value);

/** Does this kind render the given optional field group? */
export const kindHas = (kind: ArticleKind, section: ArticleSection): boolean =>
  ARTICLE_KIND_CONFIG[kind].sections.includes(section);

/**
 * The kinds that name a third party.
 *
 * Both put a client's name, and usually a named employee's words, on a public
 * page, so both need sign-off on file before they can be published.
 */
export const namesAClient = (kind: ArticleKind): boolean =>
  kind === "case-study" || kind === "customer-story";

/** Announcement types, the categories a newsroom actually files under. */
export const NEWS_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "press-release", label: "Press release", hint: "Formal announcement, full release format" },
  { value: "award",         label: "Award",         hint: "Recognition received, name the awarding body" },
  { value: "certification", label: "Certification", hint: "A standard we now hold, name the auditor" },
  { value: "partnership",   label: "Partnership",   hint: "Joint announcement, both parties must approve" },
  { value: "milestone",     label: "Milestone",     hint: "Growth, anniversaries, new offices" },
  { value: "event",         label: "Event",         hint: "Where we will be, with the date up front" },
  { value: "coverage",      label: "In the press",  hint: "Someone else wrote it, link out to them" },
];

// ── Status ───────────────────────────────────────────────────────────────────

export interface ArticleStatusConfig {
  key: ArticleStatus;
  label: string;
  tone: Tone;
  /** What this state means for the reader, shown in the status picker. */
  hint: string;
}

export const ARTICLE_STATUSES: ArticleStatusConfig[] = [
  { key: "draft",     label: "Draft",     tone: "slate",   hint: "Being written. Not on the site." },
  { key: "in-review", label: "In review", tone: "amber",   hint: "Written, waiting on a second reader." },
  { key: "scheduled", label: "Scheduled", tone: "violet",  hint: "Approved. Goes live on its publish date." },
  { key: "published", label: "Published", tone: "emerald", hint: "Live on the site now." },
  { key: "archived",  label: "Archived",  tone: "rose",    hint: "Retired. The URL still resolves." },
];

export const ARTICLE_STATUS_META = Object.fromEntries(
  ARTICLE_STATUSES.map((s) => [s.key, s]),
) as Record<ArticleStatus, ArticleStatusConfig>;

export const articleStatusLabel = (status?: string): string =>
  ARTICLE_STATUS_META[status as ArticleStatus]?.label ?? status ?? "Draft";

export const articleStatusTone = (status?: string): Tone =>
  ARTICLE_STATUS_META[status as ArticleStatus]?.tone ?? "slate";

/**
 * Is this piece visible to the public right now?
 *
 * The single answer to that question, used by the public reader and by the
 * admin's "live" count so they can never disagree. Two things must hold: an
 * editor has approved it, and its publish moment has arrived. A `scheduled`
 * piece whose date has passed IS live, which is what makes scheduling work
 * without a job that rewrites rows at midnight.
 */
export function isLive(article: Pick<Article, "status" | "publishedAt">, now = new Date()): boolean {
  if (article.status !== "published" && article.status !== "scheduled") return false;
  if (!article.publishedAt) return article.status === "published";
  const at = new Date(article.publishedAt).getTime();
  return Number.isFinite(at) && at <= now.getTime();
}

/** Approved, but its publish date has not arrived yet. */
export function isPending(article: Pick<Article, "status" | "publishedAt">, now = new Date()): boolean {
  return (
    (article.status === "scheduled" || article.status === "published") &&
    !isLive(article, now)
  );
}

// ── Slugs ────────────────────────────────────────────────────────────────────

/**
 * URL segment from a headline: lower case, ASCII, hyphens, no trailing junk.
 *
 * Accents are decomposed rather than dropped, so "Über" becomes "uber" and not
 * "ber". Capped at 80 characters on a word boundary: the slug is a permanent
 * public URL and a 200-character one is unusable in a link, an email or a
 * search result.
 */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u0027\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base.length <= 80) return base;
  const cut = base.slice(0, 80);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 40 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "");
}

/**
 * A slug not already taken within its kind, "hiring-in-2026-2" if it is.
 *
 * `taken` is the slugs of every OTHER piece in that section, so re-saving a
 * record does not bump its own slug and break its URL.
 */
export function uniqueSlug(desired: string, taken: Iterable<string>): string {
  const base = slugify(desired) || "untitled";
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

// ── Derived reading aids ─────────────────────────────────────────────────────

/** Words in a rich-text field, tags stripped. */
export function wordCount(html?: string | null): number {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Reading time in minutes at 225 wpm, the figure publishing tools settle on for
 * prose on a screen. Always at least 1: "0 min read" reads as an error.
 */
export function readingMinutes(html?: string | null): number {
  const words = wordCount(html);
  return words === 0 ? 0 : Math.max(1, Math.round(words / 225));
}

/**
 * Card summary from the body when the author has not written one.
 *
 * A derived excerpt is a fallback, never a substitute: it cuts mid-argument and
 * it is also the meta description, which is the sentence that decides whether
 * anyone clicks the search result. The editor nags for a written one.
 */
export function deriveExcerpt(html?: string | null, maxLength = 200): string {
  const text = (html || "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Metrics off a request body, coerced and bounded.
 *
 * Kept out of validate.ts because that declares flat fields and this is a list
 * of objects; the same principle applies though, only the three declared keys
 * survive. Six is the cap because a "results" band of ten figures is a table
 * nobody reads, not a proof point.
 */
export function normalizeMetrics(raw: unknown): ArticleMetric[] {
  if (!Array.isArray(raw)) return [];
  const out: ArticleMetric[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim().slice(0, 60) : "";
    const value = typeof row.value === "string" ? row.value.trim().slice(0, 40) : "";
    if (!label || !value) continue;
    const note = typeof row.note === "string" ? row.note.trim().slice(0, 120) : "";
    out.push(note ? { label, value, note } : { label, value });
    if (out.length === 6) break;
  }
  return out;
}

// ── Publish rules ────────────────────────────────────────────────────────────

/**
 * Everything standing between this piece and the public, in the order an editor
 * would raise it. An empty list means it is ready.
 *
 * These are the rules a publishing team enforces by convention and then forgets
 * once under deadline, so they are enforced here instead, and again in the route
 * handler, which is the half that actually binds (§5, UI gating is courtesy).
 */
export function publishBlockers(article: Partial<Article>): string[] {
  const kind = (article.kind ?? "blog") as ArticleKind;
  const blockers: string[] = [];

  if (!article.title?.trim()) blockers.push("It needs a headline.");
  if (!article.slug?.trim()) blockers.push("It needs a URL slug.");
  if (!article.excerpt?.trim()) {
    blockers.push("Write the summary. It is the card text and the search-result description.");
  }
  // Scheduling is `status` plus a date, and the date is the half that does the
  // work. Without it `isLive` never returns true, so the piece would sit in
  // "Scheduled" forever looking finished and never appear on the site.
  if (article.status === "scheduled" && !article.publishedAt) {
    blockers.push("Scheduled, but no publish date is set, so it would never appear.");
  }

  if (kind === "news") {
    if (!article.datelineCity?.trim()) blockers.push("A release needs a dateline city.");
    if (!article.pressContactEmail?.trim()) {
      blockers.push("A release needs a media contact a journalist can reach.");
    }
    if (!article.body?.trim() && !article.externalUrl?.trim()) {
      blockers.push("Write the release, or link the coverage it points at.");
    }
  } else if (!article.body?.trim() && kind === "blog") {
    blockers.push("The post has no body.");
  }

  if (kind === "case-study") {
    if (!article.challenge?.trim()) blockers.push("A case study needs the challenge.");
    if (!article.approach?.trim()) blockers.push("A case study needs what we actually did.");
    if (!article.results?.trim()) blockers.push("A case study needs its results.");
    if (!article.metrics?.length) {
      blockers.push("Add at least one figure. A case study with no numbers is a brochure.");
    }
  }

  if (kind === "customer-story" && !article.quote?.trim()) {
    blockers.push("A customer story is carried by the quote. It has none.");
  }

  if (namesAClient(kind) && !article.approvalOnFile) {
    blockers.push(
      article.clientName
        ? `${article.clientName} has not signed off. Naming a client without approval is the one mistake here that costs an account.`
        : "The client has not signed off yet.",
    );
  }

  return blockers;
}

/** Statuses that put a piece in front of the public, so the blockers apply. */
export const isPublishIntent = (status?: string): boolean =>
  status === "published" || status === "scheduled";

// ── SEO hygiene ──────────────────────────────────────────────────────────────

/** Google truncates a title around 60 characters and a description around 160. */
export const SEO_LIMITS = { title: 60, description: 160 } as const;

/**
 * Non-blocking editorial warnings, the things a reviewer would mention but
 * would not hold the piece for. Kept separate from `publishBlockers` on
 * purpose: a checklist that mixes "you have no client approval" with "your
 * headline is four characters long" trains people to ignore all of it.
 */
export function editorialWarnings(article: Partial<Article>): string[] {
  const warnings: string[] = [];
  const seoTitle = (article.seoTitle || article.title || "").trim();
  const seoDescription = (article.seoDescription || article.excerpt || "").trim();

  if (seoTitle.length > SEO_LIMITS.title) {
    warnings.push(`The search title is ${seoTitle.length} characters; Google shows about ${SEO_LIMITS.title}.`);
  }
  if (seoDescription && seoDescription.length > SEO_LIMITS.description) {
    warnings.push(`The search description is ${seoDescription.length} characters; about ${SEO_LIMITS.description} is shown.`);
  }
  if (article.heroImageUrl && !article.heroImageAlt?.trim()) {
    warnings.push("The hero image has no alt text, so it is invisible to a screen reader.");
  }
  if (!article.heroImageUrl) {
    warnings.push("No hero image, so link previews on LinkedIn and Slack will be a bare grey box.");
  }
  if (article.kind === "blog" && !article.authorName?.trim()) {
    warnings.push("No author. An unsigned post reads as marketing copy.");
  }
  if (article.kind === "blog" && !article.category) {
    warnings.push("No category, so it will not appear in any filtered view of the blog.");
  }
  if (article.quote?.trim() && !article.quoteAuthor?.trim()) {
    warnings.push("The quote is unattributed. An anonymous quote persuades nobody.");
  }
  if (article.metrics?.some((m) => !m.note)) {
    warnings.push("A figure with no baseline (“38% faster than what?”) is not yet a proof point.");
  }

  return warnings;
}

// ── Route-boundary schema ────────────────────────────────────────────────────

/**
 * The fields /api/articles accepts. Everything else on the body is dropped
 * before it can reach a record (see lib/validate.ts on why the shape is
 * declared rather than the dangerous fields blocked one at a time).
 *
 * `metrics` is deliberately absent, it is a list of objects, which this schema
 * kind does not cover; the handler runs it through `normalizeMetrics` instead.
 * Authorship (createdBy, updatedByName) is absent for the same reason it is on
 * every other route here: it comes from the verified session, never the body.
 */
export const ARTICLE_SCHEMA: Schema = {
  kind:        { kind: "string", required: true, oneOf: ARTICLE_KINDS },
  status:      { kind: "string", oneOf: ARTICLE_STATUSES.map((s) => s.key) },
  slug:        { kind: "string", maxLength: 120 },
  title:       { kind: "string", required: true, maxLength: 180 },
  subtitle:    { kind: "string", maxLength: 220 },
  excerpt:     { kind: "string", maxLength: 400 },
  body:        { kind: "string", maxLength: 120_000 },

  heroImageUrl: { kind: "string", maxLength: 500 },
  heroImageAlt: { kind: "string", maxLength: 200 },

  category:    { kind: "string", maxLength: 60 },
  tags:        { kind: "stringArray", maxLength: 40 },
  featured:    { kind: "boolean", coerce: true },

  authorName:  { kind: "string", maxLength: 80 },
  authorRole:  { kind: "string", maxLength: 80 },
  publishedAt: { kind: "string", maxLength: 40 },

  seoTitle:       { kind: "string", maxLength: 200 },
  seoDescription: { kind: "string", maxLength: 400 },
  canonicalUrl:   { kind: "string", maxLength: 500 },
  noIndex:        { kind: "boolean", coerce: true },

  clientName:     { kind: "string", maxLength: 120 },
  clientLogoUrl:  { kind: "string", maxLength: 500 },
  industry:       { kind: "string", maxLength: 80 },
  services:       { kind: "stringArray", maxLength: 60 },
  engagement:     { kind: "string", maxLength: 120 },
  challenge:      { kind: "string", maxLength: 40_000 },
  approach:       { kind: "string", maxLength: 40_000 },
  results:        { kind: "string", maxLength: 40_000 },
  quote:          { kind: "string", maxLength: 1_200 },
  quoteAuthor:    { kind: "string", maxLength: 80 },
  quoteAuthorRole:{ kind: "string", maxLength: 120 },
  approvalOnFile: { kind: "boolean", coerce: true },
  approvalNote:   { kind: "string", maxLength: 400 },

  newsType:          { kind: "string", oneOf: NEWS_TYPES.map((t) => t.value) },
  datelineCity:      { kind: "string", maxLength: 80 },
  pressContactName:  { kind: "string", maxLength: 80 },
  pressContactEmail: { kind: "string", maxLength: 160 },
  pressContactPhone: { kind: "string", maxLength: 40 },
  externalUrl:       { kind: "string", maxLength: 500 },
};

/** Rich-text fields, the ones that must pass through sanitizeRichText on save. */
export const ARTICLE_HTML_FIELDS = ["body", "challenge", "approach", "results"] as const;

// ── Search ───────────────────────────────────────────────────────────────────

/** One list-page search across every field an editor would search by. */
export function matchesArticleSearch(article: Article, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    article.title,
    article.subtitle,
    article.excerpt,
    article.slug,
    article.authorName,
    article.clientName,
    article.industry,
    article.category,
    article.quoteAuthor,
    ...(article.tags || []),
    ...(article.services || []),
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

/**
 * Newest first, by the date that matters to a reader (publish date) falling
 * back to when it was created, so an unscheduled draft still sorts sensibly
 * instead of sinking to the bottom of the list.
 */
export function byNewest(a: Article, b: Article): number {
  const at = new Date(a.publishedAt || a.createdAt).getTime();
  const bt = new Date(b.publishedAt || b.createdAt).getTime();
  return bt - at;
}
