import Link from "next/link";
import type { Article, ArticleKind } from "@/lib/aws/dynamodb";
import { ARTICLE_KIND_CONFIG, NEWS_TYPES } from "@/lib/articles";
import ArticleBanner from "./ArticleBanner";
import Photo from "./Photo";

/**
 * The index for one public content section.
 *
 * Three layouts, not one, because the three kinds of index answer different
 * questions and the references this was built against solve each one
 * differently:
 *
 *   blog                 a reading list. Headline, byline, excerpt beside a
 *                        small thumbnail, with a "Recent" rail alongside.
 *   news                 a newsroom. Dated releases, and the media contact
 *                        where a journalist looks first: top right.
 *   case study / story   a proof shelf. Bordered cards led by the client and
 *                        the outcome, with labelled facts underneath.
 *
 * What all three share, and what replaced the full-bleed photo hero this
 * started with, is the compact banner: every reference opens on a band
 * directly under the nav rather than a photograph, so the first item is above
 * the fold and the page does not change shape depending on whether the newest
 * entry happens to carry an image.
 */

const fmtLong = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

const newsTypeLabel = (value?: string) =>
  NEWS_TYPES.find((t) => t.value === value)?.label ?? "";

const hrefFor = (kind: ArticleKind, slug: string) =>
  `${ARTICLE_KIND_CONFIG[kind].publicPath}/${slug}`;

/** Outlined "read on" control, the shape all three references use. */
function ReadLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--hz-cobalt)] px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--hz-cobalt)] transition-colors hover:bg-[var(--hz-cobalt)] hover:text-white"
    >
      {label}
      <span aria-hidden>›</span>
    </Link>
  );
}

// ── Blog ─────────────────────────────────────────────────────────────────────

function BlogRow({ article }: { article: Article }) {
  const href = hrefFor("blog", article.slug);
  const topics = [article.category, ...(article.tags || [])].filter(Boolean) as string[];

  return (
    <article className="border-b border-[var(--hz-paper-line)] py-10 first:pt-0">
      <h2 className="max-w-2xl text-[30px] font-semibold leading-[1.12] tracking-[-0.025em] text-[var(--hz-text)] sm:text-[36px]">
        <Link href={href} className="transition-colors hover:text-[var(--hz-cobalt)]">
          {article.title}
        </Link>
      </h2>

      <p className="mt-3 text-[14.5px] text-[var(--hz-text-mute)]">
        {article.authorName && (
          <>
            by <span className="font-semibold text-[var(--hz-cobalt)]">{article.authorName}</span>
            {article.publishedAt ? ", " : ""}
          </>
        )}
        {article.publishedAt && (
          <time dateTime={article.publishedAt}>on {fmtLong(article.publishedAt)}</time>
        )}
      </p>

      {/* Excerpt left, thumbnail right. The image is small by design: it
          identifies the piece without competing with the headline, which is
          what a full-width image in a list ends up doing. */}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        {article.excerpt && (
          <p className="max-w-xl flex-1 text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
            {article.excerpt}
          </p>
        )}
        {article.heroImageUrl && (
          <Link
            href={href}
            aria-hidden="true"
            tabIndex={-1}
            className="relative block h-[120px] w-full flex-none overflow-hidden rounded-[3px] bg-[var(--hz-surface-2)] sm:h-[110px] sm:w-[185px]"
          >
            <Photo src={article.heroImageUrl} alt={article.heroImageAlt || ""} sizes="185px" />
          </Link>
        )}
      </div>

      <div className="mt-6">
        <ReadLink href={href} label="Read story" />
      </div>

      {topics.length > 0 && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--hz-strip-line)] pt-4 text-[13px] text-[var(--hz-text-mute)]">
          <span className="font-semibold text-[var(--hz-text)]">Topics:</span>
          {topics.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
      )}
    </article>
  );
}

function BlogLayout({ articles, subtitle }: { articles: Article[]; subtitle: string }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
      <div className="min-w-0">
        {articles.map((a) => (
          <BlogRow key={a.id} article={a} />
        ))}
      </div>

      {/* The rail. "Recent" is the only list worth standing beside the feed:
          a reader who did not want the newest piece wants the one before it. */}
      <aside className="lg:pt-1">
        <div className="lg:sticky lg:top-24">
          <p className="text-[16px] leading-relaxed text-[var(--hz-text-mute)]">{subtitle}</p>

          <h2 className="mt-9 border-b-2 border-[var(--hz-cobalt)] pb-2 text-[15px] font-semibold text-[var(--hz-text)]">
            Recent
          </h2>
          <ul>
            {articles.slice(0, 5).map((a) => (
              <li key={a.id} className="border-b border-[var(--hz-paper-line)] py-4">
                <Link
                  href={hrefFor("blog", a.slug)}
                  className="text-[15px] font-semibold leading-snug text-[var(--hz-text)] transition-colors hover:text-[var(--hz-cobalt)]"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ── News ─────────────────────────────────────────────────────────────────────

function NewsLayout({ articles }: { articles: Article[] }) {
  return (
    <>
      {/* Media inquiries, right-aligned above the releases. A journalist on
          deadline should not have to open a release to find out who to call.

          One row rather than the tall card this started as: with the section's
          intro already in the banner there is nothing to fill the left half,
          and a centred block floating in ~700px of white read as a layout
          fault rather than a deliberate aside. */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 bg-[var(--hz-paper)] px-6 py-5 sm:px-8">
        <div>
          <h2 className="text-[17px] font-semibold text-[var(--hz-text)]">Media inquiries</h2>
          <p className="mt-0.5 text-[14.5px] text-[var(--hz-text-mute)]">
            Contact our press team and we will come straight back to you.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-block flex-none border border-[var(--hz-text)] px-6 py-2.5 text-[14px] font-semibold text-[var(--hz-text)] transition-colors hover:bg-[var(--hz-text)] hover:text-white"
        >
          Get in touch
        </Link>
      </div>

      <ul className="border-t border-[var(--hz-paper-line)]">
        {articles.map((a) => {
          const type = newsTypeLabel(a.newsType);
          return (
            <li key={a.id} className="border-b border-[var(--hz-paper-line)] py-8">
              <div className="grid gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8">
                <div>
                  {a.publishedAt && (
                    <time
                      dateTime={a.publishedAt}
                      className="block text-[13.5px] font-semibold uppercase tracking-[0.07em] text-[var(--hz-text-mute)]"
                    >
                      {fmtLong(a.publishedAt)}
                    </time>
                  )}
                  {type && (
                    <span className="mt-1.5 inline-block text-[13px] text-[var(--hz-text-subtle)]">
                      {type}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[21px] font-semibold leading-snug tracking-[-0.015em] text-[var(--hz-text)] sm:text-[23px]">
                    <Link
                      href={hrefFor("news", a.slug)}
                      className="transition-colors hover:text-[var(--hz-cobalt)]"
                    >
                      {a.title}
                    </Link>
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
                      {a.excerpt}
                    </p>
                  )}
                  {a.datelineCity && (
                    <p className="mt-2 text-[13.5px] uppercase tracking-[0.06em] text-[var(--hz-text-subtle)]">
                      {a.datelineCity}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ── Case studies and customer stories ────────────────────────────────────────

function StoryCard({ article, kind }: { article: Article; kind: ArticleKind }) {
  const href = hrefFor(kind, article.slug);
  const metric = article.metrics?.[0];

  return (
    <li className="flex flex-col border border-[var(--hz-paper-line)] bg-[var(--hz-canvas)] p-6 transition-colors hover:border-[var(--hz-cobalt)]">
      {/* Client identity leads, the way a logo does on a customer card. A
          confidential engagement says so rather than leaving a hole. */}
      {article.clientLogoUrl ? (
        <span className="relative mb-5 block h-9 w-full max-w-[160px] overflow-hidden">
          <Photo src={article.clientLogoUrl} alt={article.clientName || ""} sizes="160px" />
        </span>
      ) : (
        <span className="mb-5 block text-[17px] font-bold tracking-[-0.01em] text-[var(--hz-text)]">
          {article.clientName || "Confidential client"}
        </span>
      )}

      <h2 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-[var(--hz-text)]">
        <Link href={href} className="transition-colors hover:text-[var(--hz-cobalt)]">
          {article.title}
        </Link>
      </h2>

      {metric && (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[var(--hz-cobalt)]">
            {metric.value}
          </span>
          <span className="text-[14px] text-[var(--hz-text-mute)]">{metric.label}</span>
        </p>
      )}

      {kind === "customer-story" && !metric && article.quote && (
        <p className="mt-4 text-[15px] italic leading-relaxed text-[var(--hz-text-mute)]">
          “{article.quote}”
        </p>
      )}

      {/* Labelled facts, which is what makes a card scannable without reading
          the headline twice. */}
      <dl className="mt-5 space-y-1 text-[14px]">
        {article.industry && (
          <div className="flex flex-wrap gap-x-1.5">
            <dt className="font-semibold text-[var(--hz-text)]">Industry:</dt>
            <dd className="text-[var(--hz-text-mute)]">{article.industry}</dd>
          </div>
        )}
        {article.engagement && (
          <div className="flex flex-wrap gap-x-1.5">
            <dt className="font-semibold text-[var(--hz-text)]">Engagement:</dt>
            <dd className="text-[var(--hz-text-mute)]">{article.engagement}</dd>
          </div>
        )}
      </dl>

      {/* mt-auto pins the control to the foot of the card, so a row of cards
          with different amounts of text still lines its buttons up. */}
      <div className="mt-auto pt-6">
        <ReadLink href={href} label="Read more" />
      </div>
    </li>
  );
}

function StoriesLayout({ articles, kind }: { articles: Article[]; kind: ArticleKind }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => (
        <StoryCard key={a.id} article={a} kind={kind} />
      ))}
    </ul>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

export default function ArticleIndex({
  kind,
  articles,
  title,
  subtitle,
}: {
  kind: ArticleKind;
  articles: Article[];
  /** The section's NAME, as it reads in the banner: "Blog", "News". */
  title: string;
  subtitle: string;
}) {
  const config = ARTICLE_KIND_CONFIG[kind];
  const isStories = kind === "case-study" || kind === "customer-story";

  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* The banner names the section and nothing more, which is what all
          three references do. On blog the descriptive line moves to the rail,
          so it is not printed twice. */}
      <ArticleBanner title={title} subtitle={kind === "blog" ? undefined : subtitle} />

      <section className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20 2xl:px-24">
        <div className="mx-auto max-w-6xl">
          {/* No back link on an index. These are top-level destinations
              reached from the nav, so there is nothing above them to go back
              to; the control belongs on an article, where it returns here. */}
          {kind === "blog" ? (
            <BlogLayout articles={articles} subtitle={subtitle} />
          ) : kind === "news" ? (
            <NewsLayout articles={articles} />
          ) : (
            <StoriesLayout articles={articles} kind={kind} />
          )}

          {articles.length === 1 && !isStories && (
            <p className="mt-10 text-[15px] text-[var(--hz-text-mute)]">
              More {config.plural} are on the way.
            </p>
          )}
        </div>
      </section>

      {/* No closing CTA. The site footer already carries the ways to get in
          touch, and a sales panel under a reading list asks for something the
          reader did not come for. */}
    </div>
  );
}
