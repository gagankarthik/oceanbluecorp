import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero, { type Cell } from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import BackLink from "@/components/site/BackLink";
import { getService, industries, layers, services, servicesByLayer, steps, type LayerId } from "@/lib/site-content";
import { servicePages } from "@/lib/service-pages";
import { breadcrumbJsonLd, jsonLdString, ORG_ID, pageMetadata, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const mastheads: Record<LayerId, Cell[]> = {
  people: [{ photo: "facade" }, { tone: "bg-tide-200" }, { photo: "bridge" }, { tone: "bg-ocean-600" }, { photo: "lattice" }],
  platforms: [{ photo: "lattice" }, { tone: "bg-ocean-600" }, { photo: "tower", position: "50% 70%" }, { tone: "bg-navy-900" }, { photo: "facade" }],
  operations: [{ photo: "concrete" }, { tone: "bg-navy-900" }, { photo: "tower", position: "50% 70%" }, { tone: "bg-ocean-600" }, { photo: "bridge" }],
};

/** Break a name into two lines near its middle, at a word boundary */
function twoLines(name: string): [string] | [string, string] {
  const words = name.split(" ");
  if (words.length === 1) return [name];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === "&") continue; // never start a line with "&"
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export const revalidate = 3600;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = servicePages[slug];
  if (!getService(slug) || !page) return {};
  return pageMetadata({ path: `/services/${slug}`, title: page.meta.title, description: page.meta.description, keywords: page.meta.keywords });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  const page = servicePages[slug];
  if (!service || !page) notFound();

  const layer = layers[service.layer];
  const related = [...servicesByLayer(service.layer), ...services]
    .filter((s, i, all) => s.slug !== service.slug && all.findIndex((x) => x.slug === s.slug) === i)
    .slice(0, 4);
  const sectors = industries.filter((i) => i.services.includes(service.slug));

  const url = `${SITE_URL}/services/${slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service`,
      name: service.name,
      serviceType: service.name,
      description: page.meta.description,
      url,
      provider: { "@id": ORG_ID },
      areaServed: { "@type": "Country", name: "United States" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: service.name,
        itemListElement: service.facets.map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
      },
    },
    breadcrumbJsonLd([
      { name: "Services", path: "/services" },
      { name: service.name, path: `/services/${slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <PageHero
        cells={mastheads[service.layer]}
        lines={twoLines(service.name)}
        standfirst={service.tagline}
        side={
          <>
            <BackLink href="/services" label="All services" />
            <p className="mt-4">
              Part of{" "}
              <Link href={`/services#${service.layer}`} className="text-navy-900 underline underline-offset-4">
                {layer.name}
              </Link>
              , our {layer.practice.toLowerCase()} practice.
            </p>
          </>
        }
      />

      <section className="bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <Photo name={service.photo} className="aspect-[4/5]" position={service.photo === "plant" ? "0% 50%" : "center"} />
          </div>
          <div className="axis" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            <p className="max-w-[40ch] text-[clamp(1.375rem,2vw,1.875rem)] leading-[1.3] [text-indent:3em]">{service.intro}</p>
            <p className="mt-12 text-[20px] font-medium">{service.facetsLabel}</p>
            <p className="mt-2 max-w-[46ch] text-mist-600">{service.facets.join(", ")}.</p>
            {page.moreFacets && (
              <>
                <p className="mt-8 text-[20px] font-medium">{page.moreFacets.label}</p>
                <p className="mt-2 max-w-[46ch] text-mist-600">{page.moreFacets.items.join(", ")}.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-ocean-600 text-white">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <h2 className="display side text-[clamp(2.25rem,4vw,3.75rem)]" data-reveal>
            What you get
          </h2>
          <dl className="axis grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {service.includes.map((item, i) => (
              <div key={item.title} data-reveal style={{ "--d": i % 2 } as React.CSSProperties}>
                <dt className="text-[20px] font-medium">{item.title}</dt>
                <dd className="mt-2 max-w-[36ch] text-white">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-field-paper">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 className="display text-[clamp(2.25rem,4vw,3.75rem)]">Our process</h2>
            <p className="mt-4 max-w-[30ch] text-mist-600">
              The same four steps on every engagement.{" "}
              <Link href="/how-we-work" className="text-navy-900 underline underline-offset-4 hover:text-ocean-700">
                How we work
              </Link>
            </p>
          </div>
          <ol className="axis grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.name} data-reveal style={{ "--d": i % 2 } as React.CSSProperties}>
                <p className="text-[20px] font-medium">{s.name}</p>
                <p className="mt-2 max-w-[36ch]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-field-mist">
        <div className="gutter grid gap-16 py-24 md:py-32 lg:grid-cols-12">
          <div className="side">
            <h2 className="display text-[clamp(2rem,3vw,2.75rem)]" data-reveal>
              Related services
            </h2>
            <ul className="mt-10 grid gap-6">
              {related.map((s) => (
                <li key={s.slug} data-reveal>
                  <Link href={`/services/${s.slug}`} className="group block">
                    <span className="display block text-[1.75rem] transition-colors group-hover:text-ocean-700">{s.name}</span>
                    <span className="mt-1 block text-[15px] text-mist-600">{layers[s.layer].name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {sectors.length > 0 && (
            <div className="axis">
              <h2 className="display text-[clamp(2rem,3vw,2.75rem)]" data-reveal>
                Industries we serve
              </h2>
              <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                {sectors.map((ind) => (
                  <li key={ind.slug} data-reveal>
                    <Link href={`/industries#${ind.slug}`} className="group block">
                      <Photo name={ind.photo} className="aspect-[4/3]" sizes="25vw" position={ind.photo === "plant" ? "0% 50%" : "center"} />
                      <span className="mt-4 block text-[20px] transition-colors group-hover:text-ocean-700">{ind.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <Closing lines={["Discuss your", "requirements"]} />
    </>
  );
}
