import Link from "next/link";
import type { Article, ArticleKind } from "@/lib/aws/dynamodb";
import { ARTICLE_KIND_CONFIG, NEWS_TYPES } from "@/lib/articles";
import ArticleBanner from "./ArticleBanner";
import Photo from "./Photo";
import { IconArrowRight } from "@/components/site/icons";
import { CONTAINER, SECTION_Y } from "@/components/site/sections";

/**
 * The index for one public content section, in the site system.
 *
 * Three layouts, because the three kinds answer different questions:
 *
 *   blog                 a reading list: headline, byline, excerpt beside a
 *                        small thumbnail, with a "Recent" rail alongside.
 *   news                 a newsroom: dated releases, and the media contact
 *                        first, where a journalist looks.
 *   case study / story   a proof shelf: cards led by the client and the
 *                        outcome, with labelled facts underneath.
 *
 * All three open on the same slim banner, so the first item is above the fold
 * whether or not the newest entry carries an image.
 */

const fmtLong = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const newsTypeLabel = (value?: string) => NEWS_TYPES.find((t) => t.value === value)?.label ?? "";

const hrefFor = (kind: ArticleKind, slug: string) => `${ARTICLE_KIND_CONFIG[kind].publicPath}/${slug}`;

/** The one "read on" control, the same everywhere in Resources. */
function ReadLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-[15px] font-semibold text-ink transition-colors hover:text-cobalt">
      {label}
      <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line bg-white px-3 py-1 type-caption text-ink-muted">{children}</span>;
}

// ── Blog ─────────────────────────────────────────────────────────────────────

function BlogRow({ article }: { article: Article }) {
  const href = hrefFor("blog", article.slug);
  const topics = [article.category, ...(article.tags || [])].filter(Boolean) as string[];

  return (
    <article className="reveal border-b border-line py-10 first:pt-0">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="min-w-0 flex-1">
          <p className="type-body-sm text-ink-subtle">
            {article.publishedAt && <time dateTime={article.publishedAt}>{fmtLong(article.publishedAt)}</time>}
            {article.authorName && (
              <>
                {article.publishedAt && <span aria-hidden> · </span>}
                <span className="font-medium text-ink-muted">{article.authorName}</span>
              </>
            )}
            {!!article.readingMinutes && (
              <>
                <span aria-hidden> · </span>
                {article.readingMinutes} min read
              </>
            )}
          </p>
          <h2 className="mt-3 type-headline-sm font-semibold text-ink">
            <Link href={href} className="transition-colors hover:text-cobalt">
              {article.title}
            </Link>
          </h2>
          {article.excerpt && <p className="mt-3 max-w-[60ch] type-body text-ink-muted">{article.excerpt}</p>}
          {topics.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {topics.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          )}
          <div className="mt-6">
            <ReadLink href={href} label="Read the post" />
          </div>
        </div>
        {/* Small by design: it identifies the piece without competing with the headline. */}
        {article.heroImageUrl && (
          <Link
            href={href}
            aria-hidden="true"
            tabIndex={-1}
            className="relative block aspect-[16/10] w-full flex-none overflow-hidden rounded-xl bg-paper-deep sm:w-[240px]"
          >
            <Photo src={article.heroImageUrl} alt={article.heroImageAlt || ""} sizes="240px" />
          </Link>
        )}
      </div>
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

      {/* "Recent" is the only list worth standing beside the feed. */}
      <aside>
        <div className="rounded-2xl border border-line bg-paper p-6 lg:sticky lg:top-28">
          <p className="type-body text-ink-muted">{subtitle}</p>
          <h2 className="mt-6 type-label font-semibold text-ink">Recent</h2>
          <ul className="mt-2 divide-y divide-line">
            {articles.slice(0, 5).map((a) => (
              <li key={a.id} className="py-3">
                <Link href={hrefFor("blog", a.slug)} className="text-[15px] leading-snug font-semibold text-ink transition-colors hover:text-cobalt">
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
      {/* Media inquiries first: a journalist on deadline should not have to
          open a release to find out who to call. */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-6 py-5 sm:px-8">
        <div>
          <h2 className="type-title font-semibold text-ink">Media inquiries</h2>
          <p className="mt-0.5 type-body text-ink-muted">Contact our press team and we will come straight back to you.</p>
        </div>
        <Link
          href="/contact"
          className="inline-flex h-11 flex-none items-center rounded-full border border-line-strong bg-white px-5 type-label font-semibold text-ink transition-colors hover:border-cobalt"
        >
          Get in touch
        </Link>
      </div>

      <ul className="border-t border-line">
        {articles.map((a) => {
          const type = newsTypeLabel(a.newsType);
          return (
            <li key={a.id} className="reveal border-b border-line py-8">
              <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8">
                <div>
                  {a.publishedAt && (
                    <time dateTime={a.publishedAt} className="block type-label font-semibold text-ink">
                      {fmtLong(a.publishedAt)}
                    </time>
                  )}
                  {type && <span className="mt-1 inline-block type-body-sm text-ink-subtle">{type}</span>}
                </div>
                <div className="min-w-0">
                  <h2 className="type-title-lg font-semibold text-ink">
                    <Link href={hrefFor("news", a.slug)} className="transition-colors hover:text-cobalt">
                      {a.title}
                    </Link>
                  </h2>
                  {a.excerpt && <p className="mt-2 max-w-[64ch] type-body text-ink-muted">{a.excerpt}</p>}
                  {a.datelineCity && <p className="mt-2 type-body-sm text-ink-subtle">{a.datelineCity}</p>}
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
    <li className="reveal group flex flex-col rounded-2xl border border-line bg-white p-7 transition-[border-color,box-shadow] duration-250 hover:border-line-strong hover:shadow-raised">
      {/* Client identity leads. A confidential engagement says so rather than leaving a hole. */}
      {article.clientLogoUrl ? (
        <span className="relative mb-6 block h-9 w-full max-w-[160px] overflow-hidden">
          <Photo src={article.clientLogoUrl} alt={article.clientName || ""} sizes="160px" />
        </span>
      ) : (
        <span className="mb-6 block type-title font-semibold text-ink">{article.clientName || "Confidential client"}</span>
      )}

      <h2 className="type-title-lg font-semibold text-ink">
        <Link href={href} className="transition-colors hover:text-cobalt">
          {article.title}
        </Link>
      </h2>

      {metric && (
        <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
          <span className="type-headline-sm font-semibold text-cobalt">{metric.value}</span>
          <span className="type-body-sm text-ink-muted">{metric.label}</span>
        </p>
      )}

      {kind === "customer-story" && !metric && article.quote && (
        <p className="mt-4 type-body text-ink-muted">&ldquo;{article.quote}&rdquo;</p>
      )}

      {(article.industry || article.engagement) && (
        <dl className="mt-5 space-y-1 border-t border-line pt-4 type-body-sm">
          {article.industry && (
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="font-semibold text-ink">Industry</dt>
              <dd className="text-ink-muted">{article.industry}</dd>
            </div>
          )}
          {article.engagement && (
            <div className="flex flex-wrap gap-x-1.5">
              <dt className="font-semibold text-ink">Engagement</dt>
              <dd className="text-ink-muted">{article.engagement}</dd>
            </div>
          )}
        </dl>
      )}

      {/* mt-auto pins the control to the foot, so a row of cards lines up. */}
      <div className="mt-auto pt-7">
        <ReadLink href={href} label="Read more" />
      </div>
    </li>
  );
}

function StoriesLayout({ articles, kind }: { articles: Article[]; kind: ArticleKind }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    <>
      {/* On blog the descriptive line moves to the rail, so it is not printed twice. */}
      <ArticleBanner title={title} subtitle={kind === "blog" ? undefined : subtitle} />

      <section data-tone={isStories ? "paper" : "white"} className={`${isStories ? "bg-paper" : "bg-white"} ${SECTION_Y}`}>
        <div className={CONTAINER}>
          {kind === "blog" ? (
            <BlogLayout articles={articles} subtitle={subtitle} />
          ) : kind === "news" ? (
            <NewsLayout articles={articles} />
          ) : (
            <StoriesLayout articles={articles} kind={kind} />
          )}

          {articles.length === 1 && !isStories && <p className="mt-10 type-body text-ink-subtle">More {config.plural} are on the way.</p>}
        </div>
      </section>
      {/* No closing CTA: a sales panel under a reading list asks for something
          the reader did not come for. The footer carries the ways in touch. */}
    </>
  );
}
