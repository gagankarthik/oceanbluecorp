import Link from "next/link";
import type { Article, ArticleKind } from "@/lib/aws/dynamodb";
import { ARTICLE_KIND_CONFIG, NEWS_TYPES } from "@/lib/articles";
import { renderRichText } from "@/lib/rich-text";
import ArticleBanner from "./ArticleBanner";
import BackLink from "./BackLink";

/**
 * One published piece, in any of the four sections.
 *
 * The kind decides the SHAPE, because the four are genuinely different
 * documents: a case study argues challenge → approach → results with figures,
 * a customer story is carried by a quote, a release opens on a dateline and
 * closes on a media contact, and a blog post is prose with a byline. Rendering
 * all four as "title + body" would throw away the structure the editor was
 * built to capture.
 *
 * Body HTML is sanitized at SAVE time (`sanitizeRichText`, STANDARDS §5.6), so
 * `renderRichText` is handed something already safe. Nothing here re-sanitizes,
 * and nothing here should ever render a field that skipped that path.
 */

const fmtLong = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

const newsTypeLabel = (value?: string) =>
  NEWS_TYPES.find((t) => t.value === value)?.label ?? "";

/** Shared prose styling for every rich-text field on the page. */
const PROSE =
  "text-[17px] leading-[1.75] text-[var(--hz-text-mute)] " +
  "[&_p]:mb-5 [&_strong]:font-semibold [&_strong]:text-[var(--hz-text)] " +
  "[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 " +
  "[&_a]:font-medium [&_a]:text-[var(--hz-cobalt)] [&_a]:underline [&_a]:underline-offset-2";

function Rich({ html }: { html?: string }) {
  if (!html?.trim()) return null;
  return <div className={PROSE} dangerouslySetInnerHTML={renderRichText(html)} />;
}

function Band({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--hz-paper-line)] pt-9">
      <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--hz-text-subtle)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** The proof strip. Each figure states what it is measured against. */
function Metrics({ article }: { article: Article }) {
  if (!article.metrics?.length) return null;
  return (
    <div className="grid gap-6 border-y border-[var(--hz-paper-line)] py-8 sm:grid-cols-2 lg:grid-cols-3">
      {article.metrics.map((m) => (
        <div key={`${m.label}-${m.value}`}>
          <p className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-[var(--hz-text)]">
            {m.value}
          </p>
          <p className="mt-2 text-[15px] font-medium text-[var(--hz-text)]">{m.label}</p>
          {m.note && (
            <p className="mt-1 text-[14px] leading-snug text-[var(--hz-text-mute)]">{m.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function PullQuote({ article }: { article: Article }) {
  if (!article.quote?.trim()) return null;
  return (
    <figure className="border-l-2 border-[var(--hz-cobalt)] py-1 pl-6">
      <blockquote className="text-[22px] font-medium leading-[1.5] tracking-[-0.01em] text-[var(--hz-text)] sm:text-[26px]">
        “{article.quote}”
      </blockquote>
      {article.quoteAuthor && (
        <figcaption className="mt-4 text-[15px] text-[var(--hz-text-mute)]">
          <span className="font-semibold text-[var(--hz-text)]">{article.quoteAuthor}</span>
          {article.quoteAuthorRole ? `, ${article.quoteAuthorRole}` : ""}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Author row for the hero: an initials disc and "Written by".
 *
 * Initials rather than a photograph because there is no author-image field on
 * an article, and inventing one to hold a URL nobody fills would leave most
 * posts with a broken circle. A disc keeps the shape the layout expects.
 */
function Byline({ name, role }: { name: string; role?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden
        className="grid h-14 w-14 flex-none place-items-center rounded-full border border-white/25 bg-white/15 text-[17px] font-semibold text-white backdrop-blur-sm"
      >
        {initials}
      </span>
      <span className="text-[15px] text-white/85">
        Written by <span className="font-semibold text-white">{name}</span>
        {role && <span className="block text-[13.5px] text-white/70">{role}</span>}
      </span>
    </div>
  );
}

/** Client, industry, service line, engagement, the facts a buyer scans first. */
function EngagementFacts({ article }: { article: Article }) {
  const facts: [string, string][] = [];
  facts.push(["Client", article.clientName || "Confidential"]);
  if (article.industry) facts.push(["Industry", article.industry]);
  if (article.engagement) facts.push(["Engagement", article.engagement]);
  if (article.services?.length) facts.push(["What we delivered", article.services.join(", ")]);
  if (facts.length === 0) return null;

  return (
    <dl className="grid gap-x-10 gap-y-5 border-b border-[var(--hz-paper-line)] pb-8 sm:grid-cols-2">
      {facts.map(([term, value]) => (
        <div key={term}>
          <dt className="text-[12.5px] font-semibold uppercase tracking-[0.09em] text-[var(--hz-text-subtle)]">
            {term}
          </dt>
          <dd className="mt-1.5 text-[16px] leading-snug text-[var(--hz-text)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ArticleDetail({
  article,
  related,
}: {
  article: Article;
  related: Article[];
}) {
  const kind = article.kind as ArticleKind;
  const config = ARTICLE_KIND_CONFIG[kind];
  const published = fmtLong(article.publishedAt);

  // A release opens on its dateline, the convention a journalist expects. The
  // city is authored; the date comes from publishedAt, so the two cannot
  // disagree with each other or with the page.
  const dateline =
    kind === "news" && article.datelineCity
      ? `${article.datelineCity.toUpperCase()} — ${published}`
      : null;

  /**
   * What goes in the hero's tag bar: what the piece is about, then how long it
   * takes. Capped at three, because the bar is one line over a photograph and
   * a fourth entry wraps it into a block.
   */
  const heroTags = [
    article.category,
    ...(article.tags || []),
    article.readingMinutes ? `${article.readingMinutes} min read` : "",
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* The hero. The author's picture runs full-bleed and untinted; the tag
          bar and the byline carry their own contrast on top of it. Without an
          image the same component falls back to the flat navy band, so a post
          with no picture still opens correctly. */}
      <ArticleBanner
        eyebrow={kind === "news" ? newsTypeLabel(article.newsType) || config.label : config.label}
        eyebrowHref={config.publicPath}
        variant="page"
        title={article.title}
        subtitle={article.subtitle}
        image={article.heroImageUrl}
        meta={
          heroTags.length > 0 ? (
            heroTags.map((tag, i) => (
              <span key={tag} className="inline-flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-white/45">|</span>}
                {tag}
              </span>
            ))
          ) : undefined
        }
        byline={
          article.authorName ? (
            <Byline name={article.authorName} role={article.authorRole} />
          ) : undefined
        }
      />

      <article className="w-full px-6 py-14 sm:px-10 sm:py-18 lg:px-16 lg:py-24 2xl:px-24">
        <div className="mx-auto max-w-3xl">
          {/* The way out, above the piece. The banner eyebrow also links back,
              but that reads as a label on a dark band rather than a control,
              and a reader who has scrolled to the top wants an obvious one. */}
          <BackLink href={config.publicPath} label={config.label} className="mb-8" />

          {/* Byline row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--hz-paper-line)] pb-6 text-[14.5px] text-[var(--hz-text-mute)]">
            {published && <time dateTime={article.publishedAt}>{published}</time>}
            {article.authorName && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {article.authorName}
                  {article.authorRole ? `, ${article.authorRole}` : ""}
                </span>
              </>
            )}
            {article.category && (
              <>
                <span aria-hidden>·</span>
                <span>{article.category}</span>
              </>
            )}
            {kind === "blog" && !!article.readingMinutes && (
              <>
                <span aria-hidden>·</span>
                <span>{article.readingMinutes} min read</span>
              </>
            )}
          </div>

          <div className="mt-9 space-y-10">
            {/* ── Case study / customer story: the facts, then the proof ── */}
            {(kind === "case-study" || kind === "customer-story") && (
              <EngagementFacts article={article} />
            )}

            {/* A customer story is carried by the quote, so it leads. */}
            {kind === "customer-story" && <PullQuote article={article} />}

            <Metrics article={article} />

            {dateline && (
              <p className="text-[15px] font-semibold uppercase tracking-[0.06em] text-[var(--hz-text)]">
                {dateline}
              </p>
            )}

            {/* Case studies argue in three named movements. */}
            {kind === "case-study" ? (
              <>
                {article.challenge && (
                  <Band title="The challenge"><Rich html={article.challenge} /></Band>
                )}
                {article.approach && (
                  <Band title="Our approach"><Rich html={article.approach} /></Band>
                )}
                {article.results && (
                  <Band title="The results"><Rich html={article.results} /></Band>
                )}
                {article.body && <Band title="Background"><Rich html={article.body} /></Band>}
                {article.quote && (
                  <div className="border-t border-[var(--hz-paper-line)] pt-9">
                    <PullQuote article={article} />
                  </div>
                )}
              </>
            ) : (
              <Rich html={article.body} />
            )}

            {/* Coverage we did not write: link out rather than restate it. */}
            {article.externalUrl && (
              <p className="border-t border-[var(--hz-paper-line)] pt-8">
                <a
                  href={article.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-semibold text-[var(--hz-cobalt)] underline underline-offset-2"
                >
                  Read the full story at the source →
                </a>
              </p>
            )}

            {/* Media contact, so a journalist on deadline can reach someone. */}
            {kind === "news" && (article.pressContactEmail || article.pressContactName) && (
              <Band title="Media contact">
                <p className="text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
                  {article.pressContactName && (
                    <span className="block font-medium text-[var(--hz-text)]">
                      {article.pressContactName}
                    </span>
                  )}
                  {article.pressContactEmail && (
                    <a
                      href={`mailto:${article.pressContactEmail}`}
                      className="text-[var(--hz-cobalt)] underline underline-offset-2"
                    >
                      {article.pressContactEmail}
                    </a>
                  )}
                  {article.pressContactPhone && (
                    <span className="block">{article.pressContactPhone}</span>
                  )}
                </p>
              </Band>
            )}

            {article.tags && article.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 border-t border-[var(--hz-paper-line)] pt-8">
                {article.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-[3px] border border-[var(--hz-paper-line)] bg-[var(--hz-paper)] px-2.5 py-1 text-[13px] text-[var(--hz-text-mute)]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </article>

      {/* You may also like. Three at most: a longer tail stops being a
          recommendation and becomes a second index. `getRelatedArticles`
          already caps it, and the grid is sized to match. */}
      {related.length > 0 && (
        <section className="w-full border-t border-[var(--hz-paper-line)] bg-[var(--hz-paper)] px-6 py-16 sm:px-10 lg:px-16 lg:py-20 2xl:px-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--hz-text-subtle)]">
              You may also like
            </h2>

            <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id} className="border-t-2 border-[var(--hz-text)] pt-5">
                  {r.publishedAt && (
                    <time
                      dateTime={r.publishedAt}
                      className="block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--hz-text-mute)]"
                    >
                      {fmtLong(r.publishedAt)}
                    </time>
                  )}
                  <h3 className="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.01em]">
                    <Link
                      href={`${config.publicPath}/${r.slug}`}
                      className="text-[var(--hz-text)] transition-colors hover:text-[var(--hz-cobalt)]"
                    >
                      {r.title}
                    </Link>
                  </h3>
                  {r.excerpt && (
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                      {r.excerpt}
                    </p>
                  )}
                  {!!r.readingMinutes && (
                    <p className="mt-3 text-[13px] text-[var(--hz-text-subtle)]">{r.readingMinutes} min read</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {/* No closing CTA. The back link at the top already returns to the
          section, and the footer carries the ways to get in touch. */}
    </div>
  );
}
