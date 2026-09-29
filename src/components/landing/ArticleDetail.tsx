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
 * closes on a media contact, and a blog post is prose with a byline.
 *
 * Body HTML is sanitized at SAVE time (`sanitizeRichText`, STANDARDS §5.6), so
 * `renderRichText` is handed something already safe. Nothing here re-sanitizes,
 * and nothing here should ever render a field that skipped that path.
 */

const fmtLong = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

const newsTypeLabel = (value?: string) => NEWS_TYPES.find((t) => t.value === value)?.label ?? "";

/** Shared prose styling for every rich-text field on the page. */
const PROSE =
  "type-body-lg text-ink-muted" +
  "[&_p]:mb-5 [&_strong]:font-semibold [&_strong]:text-ink " +
  "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:type-headline-sm [&_h2]:text-ink " +
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:type-title-lg [&_h3]:text-ink " +
  "[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 " +
  "[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-cobalt [&_blockquote]:pl-5 [&_blockquote]:text-ink " +
  "[&_a]:font-medium [&_a]:text-cobalt [&_a]:underline [&_a]:underline-offset-4";

function Rich({ html }: { html?: string }) {
  if (!html?.trim()) return null;
  return <div className={PROSE} dangerouslySetInnerHTML={renderRichText(html)} />;
}

/** A named movement of the piece: "The challenge", "Our approach". */
function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-9">
      <h2 className="mb-5 type-title-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** The proof strip. Each figure states what it is measured against. */
function Metrics({ article }: { article: Article }) {
  if (!article.metrics?.length) return null;
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {article.metrics.map((m) => (
        <div key={`${m.label}-${m.value}`} className="bg-white p-6">
          <p className="type-headline font-semibold text-cobalt">{m.value}</p>
          <p className="mt-3 text-[15px] font-semibold text-ink">{m.label}</p>
          {m.note && <p className="mt-1 type-body-sm text-ink-muted">{m.note}</p>}
        </div>
      ))}
    </div>
  );
}

function PullQuote({ article }: { article: Article }) {
  if (!article.quote?.trim()) return null;
  return (
    <figure className="rounded-2xl bg-paper p-8">
      <svg viewBox="0 0 48 36" className="h-7 w-10 text-cobalt" fill="currentColor" aria-hidden>
        <path d="M0 36V21C0 9.4 6.2 2.4 18.6 0l2 4.6C13.8 6.4 10.3 10 10 15.5h9V36H0Zm27 0V21C27 9.4 33.2 2.4 45.6 0l2 4.6C40.8 6.4 37.3 10 37 15.5h9V36H27Z" />
      </svg>
      <blockquote className="mt-5 type-title-lg font-medium text-ink">{article.quote}</blockquote>
      {article.quoteAuthor && (
        <figcaption className="mt-5 type-body text-ink-muted">
          <span className="font-semibold text-ink">{article.quoteAuthor}</span>
          {article.quoteAuthorRole ? `, ${article.quoteAuthorRole}` : ""}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Author row: an initials disc and the name. Initials rather than a photo
 * because articles have no author-image field, and inventing one would leave
 * most posts with a broken circle.
 */
function Byline({ name, role, date, iso }: { name?: string; role?: string; date?: string; iso?: string }) {
  if (!name && !date) return null;
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-center gap-3.5 border-t border-line pt-6">
      {name && (
        <span aria-hidden className="grid size-12 flex-none place-items-center rounded-full bg-cobalt-tint text-[15px] font-semibold text-cobalt">
          {initials}
        </span>
      )}
      <span className="type-body text-ink-muted">
        {name && <span className="block font-semibold text-ink">{name}</span>}
        <span className="block type-body-sm text-ink-subtle">
          {[role, date].filter(Boolean).map((part, i) =>
            part === date && iso ? (
              <time key={i} dateTime={iso}>
                {i > 0 ? " · " : ""}
                {part}
              </time>
            ) : (
              <span key={i}>
                {i > 0 ? " · " : ""}
                {part}
              </span>
            ),
          )}
        </span>
      </span>
    </div>
  );
}

/** Client, industry, service line, engagement: the facts a buyer scans first. */
function EngagementFacts({ article }: { article: Article }) {
  const facts: [string, string][] = [];
  facts.push(["Client", article.clientName || "Confidential"]);
  if (article.industry) facts.push(["Industry", article.industry]);
  if (article.engagement) facts.push(["Engagement", article.engagement]);
  if (article.services?.length) facts.push(["What we delivered", article.services.join(", ")]);

  return (
    <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
      {facts.map(([term, value]) => (
        <div key={term} className="bg-white p-5">
          <dt className="type-label font-semibold text-ink-subtle">{term}</dt>
          <dd className="mt-1 type-body text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ArticleDetail({ article, related }: { article: Article; related: Article[] }) {
  const kind = article.kind as ArticleKind;
  const config = ARTICLE_KIND_CONFIG[kind];
  const published = fmtLong(article.publishedAt);

  // A release opens on its dateline. The city is authored; the date comes from
  // publishedAt, so the two cannot disagree with each other or with the page.
  const dateline = kind === "news" && article.datelineCity ? `${article.datelineCity.toUpperCase()} — ${published}` : null;

  /** What the piece is about, then how long it takes. Three at most. */
  const heroTags = [article.category, ...(article.tags || []), article.readingMinutes ? `${article.readingMinutes} min read` : ""]
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <>
      <ArticleBanner
        eyebrow={kind === "news" ? newsTypeLabel(article.newsType) || config.label : config.label}
        eyebrowHref={config.publicPath}
        variant="page"
        title={article.title}
        subtitle={article.subtitle}
        image={article.heroImageUrl}
        meta={
          heroTags.length > 0
            ? heroTags.map((tag) => (
                <span key={tag} className="rounded-full bg-paper px-3 py-1 type-caption font-medium text-ink-muted">
                  {tag}
                </span>
              ))
            : undefined
        }
        byline={<Byline name={article.authorName} role={article.authorRole} date={published} iso={article.publishedAt} />}
      />

      <article className="bg-white">
        <div className="mx-auto w-full max-w-[880px] px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:pb-24">
          <BackLink href={config.publicPath} label={config.label} className="mb-10" />

          <div className="space-y-10">
            {(kind === "case-study" || kind === "customer-story") && <EngagementFacts article={article} />}

            {/* A customer story is carried by the quote, so it leads. */}
            {kind === "customer-story" && <PullQuote article={article} />}

            <Metrics article={article} />

            {dateline && <p className="text-[15px] font-semibold text-ink">{dateline}</p>}

            {kind === "case-study" ? (
              <>
                {article.challenge && (
                  <Part title="The challenge">
                    <Rich html={article.challenge} />
                  </Part>
                )}
                {article.approach && (
                  <Part title="Our approach">
                    <Rich html={article.approach} />
                  </Part>
                )}
                {article.results && (
                  <Part title="The results">
                    <Rich html={article.results} />
                  </Part>
                )}
                {article.body && (
                  <Part title="Background">
                    <Rich html={article.body} />
                  </Part>
                )}
                {article.quote && <PullQuote article={article} />}
              </>
            ) : (
              <Rich html={article.body} />
            )}

            {/* Coverage we did not write: link out rather than restate it. */}
            {article.externalUrl && (
              <p className="border-t border-line pt-8">
                <a href={article.externalUrl} target="_blank" rel="noopener noreferrer" className="text-[16px] font-semibold text-cobalt underline underline-offset-4">
                  Read the full story at the source →
                </a>
              </p>
            )}

            {kind === "news" && (article.pressContactEmail || article.pressContactName) && (
              <Part title="Media contact">
                <p className="type-body text-ink-muted">
                  {article.pressContactName && <span className="block font-semibold text-ink">{article.pressContactName}</span>}
                  {article.pressContactEmail && (
                    <a href={`mailto:${article.pressContactEmail}`} className="text-cobalt underline underline-offset-4">
                      {article.pressContactEmail}
                    </a>
                  )}
                  {article.pressContactPhone && <span className="block">{article.pressContactPhone}</span>}
                </p>
              </Part>
            )}

            {article.tags && article.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 border-t border-line pt-8">
                {article.tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-line bg-paper px-3 py-1 type-caption text-ink-muted">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </article>

      {/* Three at most: a longer tail stops being a recommendation. */}
      {related.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="type-headline-sm font-semibold text-ink">More from {config.label}</h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id} className="group flex flex-col rounded-2xl border border-line bg-white p-6 transition-colors hover:border-line-strong">
                  {r.publishedAt && (
                    <time dateTime={r.publishedAt} className="type-body-sm text-ink-subtle">
                      {fmtLong(r.publishedAt)}
                    </time>
                  )}
                  <h3 className="mt-2 type-title-lg font-semibold">
                    <Link href={`${config.publicPath}/${r.slug}`} className="text-ink transition-colors hover:text-cobalt">
                      {r.title}
                    </Link>
                  </h3>
                  {r.excerpt && <p className="mt-2 type-body text-ink-muted">{r.excerpt}</p>}
                  {!!r.readingMinutes && <p className="mt-auto pt-4 type-body-sm text-ink-subtle">{r.readingMinutes} min read</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
