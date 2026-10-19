import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import BackLink from "@/components/site/BackLink";
import FaqList from "@/components/site/FaqList";
import { certifications, getService, industries, services } from "@/lib/site-content";
import { industryPages } from "@/lib/industry-pages";
import { breadcrumbJsonLd, jsonLdString, ORG_ID, pageMetadata, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export function generateStaticParams() {
  return industries.filter((i) => industryPages[i.slug]).map((i) => ({ slug: i.slug }));
}

const getIndustry = (slug: string) => industries.find((i) => i.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = industryPages[slug];
  if (!getIndustry(slug) || !page) return {};
  return pageMetadata({ path: `/industries/${slug}`, title: page.meta.title, description: page.meta.description });
}

/** The short name on the poster-size masthead: one word per line, "and" kept with the word before */
function mastheadLines(name: string): [string] | [string, string] {
  const words = name.split(" ");
  if (words.length === 1) return [name];
  const cut = words.length - 1;
  return [words.slice(0, cut).join(" "), words[cut]];
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  const page = industryPages[slug];
  if (!industry || !page) notFound();

  const lead = industry.services.map((s) => getService(s)!).filter(Boolean);
  const others = services.filter((s) => !industry.services.includes(s.slug));
  const url = `${SITE_URL}/industries/${slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.meta.title,
      description: page.meta.description,
      about: { "@type": "Thing", name: industry.name },
      publisher: { "@id": ORG_ID },
      mentions: lead.map((s) => ({ "@type": "Service", name: s.name, url: `${SITE_URL}/services/${s.slug}`, provider: { "@id": ORG_ID } })),
    },
    breadcrumbJsonLd([
      { name: "Industries", path: "/industries" },
      { name: industry.name, path: `/industries/${slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <PageHero
        cells={[{ photo: industry.photo }, { tone: "bg-navy-900" }, { photo: "tower", position: "50% 70%" }, { tone: "bg-ocean-600" }, { photo: "lattice" }]}
        lines={mastheadLines(industry.short)}
        standfirst={page.answer}
        side={
          <>
            <BackLink href="/industries" label="All industries" />
            <p className="mt-4">{industry.tagline}.</p>
          </>
        }
      />

      <section className="bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <Photo name={industry.photo} className="aspect-[4/5]" position={industry.photo === "plant" ? "0% 50%" : "center"} />
          </div>
          <div className="axis">
            <h2 className="display text-head" data-reveal>
              Where clients in this sector usually start
            </h2>
            <ul className="mt-12 grid gap-12">
              {lead.map((s, i) => (
                <li key={s.slug} data-reveal style={{ "--d": i } as React.CSSProperties}>
                  <Link href={`/services/${s.slug}`} className="display text-head-sm transition-colors hover:text-ocean-700">
                    {s.name}
                  </Link>
                  <p className="mt-2 text-title font-medium">{s.tagline}</p>
                  <p className="mt-3 max-w-measure text-mist-700">{s.intro}</p>
                </li>
              ))}
            </ul>
            {page.clients && page.clients.length > 0 && (
              <p className="mt-12 max-w-measure text-mist-600" data-reveal>
                Clients in this sector include {page.clients.join(", ").replace(/, ([^,]*)$/, " and $1")}.
              </p>
            )}
          </div>
        </div>
      </section>

      {slug === "government" && (
        <section aria-labelledby="certs-title" className="on-dark bg-navy-900 text-mist-50">
          <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
            <div className="side" data-reveal>
              <h2 id="certs-title" className="display text-head">
                Certified supplier
              </h2>
              <p className="mt-4 max-w-measure-narrow text-tide-300">
                Minority-owned and women-owned, with the certifications agencies count.{" "}
                <Link href="/certifications" className="font-medium text-white underline underline-offset-4">
                  All certifications
                </Link>
              </p>
            </div>
            <dl className="axis grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {certifications.flatMap((level) =>
                level.certs.map((c) => (
                  <div key={c.name} data-reveal>
                    <dt className="text-title font-medium text-white">{c.name}</dt>
                    <dd className="mt-1 text-small text-tide-300">{c.issuer}</dd>
                    <dd className="mt-3 max-w-measure-narrow text-mist-50">{c.body}</dd>
                  </div>
                )),
              )}
            </dl>
          </div>
        </section>
      )}

      <FaqList items={page.faqs} tone={slug === "government" ? "paper" : "mist"} />

      <section className="bg-field-paper">
        <div className="gutter grid gap-6 py-16 md:py-20 lg:grid-cols-12">
          <h2 className="side text-title font-medium">Also open to this sector</h2>
          <ul className="axis flex flex-wrap gap-x-6 gap-y-3">
            {others.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Closing lines={["Talk to us about", industry.short.toLowerCase()]} />
    </>
  );
}
