import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import ResourceList from "@/components/site/ResourceList";
import { byCategory, categories, getResource } from "@/lib/resources";
import { articleBreadcrumbJsonLd, articleJsonLd, articleMetadata } from "@/lib/articles-public";
import { jsonLdString } from "@/lib/seo";

const categoryPhoto = {
  "customer-stories": "teamTable",
  "case-studies": "workstation",
  blog: "writingDesk",
  news: "glassOffice",
} as const;

type Props = { params: Promise<{ category: string; slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const r = await getResource(category, slug);
  return r ? articleMetadata(r.article) : {};
}

// Article HTML is sanitized at save (sanitizeArticleHtml), so it renders as stored.
const prose =
  "grid min-w-0 gap-5 [overflow-wrap:anywhere] text-title leading-normal [&_a]:text-ocean-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-ocean-600 [&_blockquote]:pl-5 [&_h2]:display [&_h2]:mt-6 [&_h2]:text-head-sm [&_h3]:mt-4 [&_h3]:font-semibold [&_img]:w-full [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:marker:text-ocean-600";

export default async function ResourcePage({ params }: Props) {
  const { category, slug } = await params;
  const r = await getResource(category, slug);
  if (!r) notFound();
  const a = r.article;
  const cat = categories[r.category];
  const more = (await byCategory(r.category)).filter((x) => x.slug !== r.slug).slice(0, 2);

  const story = [
    { title: "The challenge", html: a.challenge },
    { title: "Our approach", html: a.approach },
    { title: "The results", html: a.results },
  ].filter((s): s is { title: string; html: string } => Boolean(s.html?.trim()));
  const byline = [a.authorName, a.authorRole].filter(Boolean).join(", ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString([articleJsonLd(a), articleBreadcrumbJsonLd(a)]) }}
      />
      <article className="bg-field-paper">
        <div id="top" className="gutter grid gap-10 pb-16 pt-10 md:pt-14 lg:grid-cols-12">
          <p className="text-small lg:col-span-12">
            <Link href="/resources" className="text-ocean-700 underline underline-offset-4">
              Resources
            </Link>
            <span className="text-mist-600"> / </span>
            <Link href={`/resources/${r.category}`} className="text-ocean-700 underline underline-offset-4">
              {cat.name}
            </Link>
          </p>
          <div className="side text-small text-mist-600 lg:pt-4">
            {cat.singular}
            {r.date ? `, ${r.date}` : ""}
            {byline && <span className="mt-1 block">{byline}</span>}
            {a.readingMinutes ? <span className="mt-1 block">{a.readingMinutes} min read</span> : null}
          </div>
          <div className="axis">
            <h1 className="lines poster text-head">
              <span className="line">
                <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                  {r.title}
                </span>
              </span>
            </h1>
            {(a.subtitle || r.summary) && (
              <p data-after-lines className="mt-8 max-w-measure-narrow text-title leading-snug">
                {a.subtitle || r.summary}
              </p>
            )}
          </div>
        </div>

        <div className="gutter grid gap-10 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side grid content-start gap-6">
            {a.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.heroImageUrl} alt={a.heroImageAlt || ""} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <Photo name={categoryPhoto[r.category]} className="aspect-[4/3]" sizes="33vw" />
            )}
            {(a.clientName || a.industry || a.engagement || a.services?.length) && (
              <dl className="grid gap-4 bg-mist-100 p-6 text-small">
                {[
                  { k: "Client", v: a.clientName },
                  { k: "Industry", v: a.industry },
                  { k: "Engagement", v: a.engagement },
                  { k: "Services", v: a.services?.join(", ") },
                ]
                  .filter((f) => f.v)
                  .map((f) => (
                    <div key={f.k}>
                      <dt className="text-mist-600">{f.k}</dt>
                      <dd className="font-medium">{f.v}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
          <div className="axis max-w-measure">
            {a.metrics && a.metrics.length > 0 && (
              <dl className="mb-12 grid gap-2 sm:grid-cols-3">
                {a.metrics.map((m) => (
                  <div key={m.label} className="flex flex-col-reverse bg-navy-900 p-6 text-mist-50">
                    <dt className="mt-2 text-small text-tide-300">
                      {m.label}
                      {m.note ? <span className="block text-mist-400">{m.note}</span> : null}
                    </dt>
                    <dd className="poster text-head-md">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {a.quote && (
              <figure className="mb-12 bg-mist-100 p-7">
                <blockquote>
                  <p className="text-title leading-snug">{a.quote}</p>
                </blockquote>
                {(a.quoteAuthor || a.quoteAuthorRole) && (
                  <figcaption className="mt-5 text-small">
                    {a.quoteAuthor && <span className="block font-medium">{a.quoteAuthor}</span>}
                    {a.quoteAuthorRole && <span className="block text-mist-600">{a.quoteAuthorRole}</span>}
                  </figcaption>
                )}
              </figure>
            )}
            {story.map((s) => (
              <section key={s.title} className="mb-12">
                <h2 className="display mb-5 text-head-md">{s.title}</h2>
                <div className={prose} dangerouslySetInnerHTML={{ __html: s.html }} />
              </section>
            ))}
            {a.body && <div className={prose} dangerouslySetInnerHTML={{ __html: a.body }} />}
            {a.externalUrl && /^https?:\/\//i.test(a.externalUrl) && (
              <p className="mt-10">
                <a href={a.externalUrl} rel="noopener" className="font-medium text-ocean-700 underline underline-offset-4">
                  Read the coverage
                </a>
              </p>
            )}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-field-mist">
          <div className="gutter grid gap-10 py-20 md:py-24 lg:grid-cols-12">
            <h2 className="display side text-head-md">More {cat.name.toLowerCase()}</h2>
            <div className="axis">
              <ResourceList items={more} showCategory={false} />
            </div>
          </div>
        </section>
      )}

      <Closing />
    </>
  );
}
