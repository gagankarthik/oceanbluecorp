import type { Metadata } from "next";
import { jsonLdString, pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Fragment } from "react";
import Anniversary from "@/components/landing/anniversary/Anniversary";
import { HeroNetwork } from "@/components/site/hero-network";
import { CustomerMarquee } from "@/components/site/customer-marquee";
import { ClientVoices } from "@/components/site/client-voices";
import { TechnologyPartnersBand, CertificationStrip } from "@/components/site/credentials";
import { Section, ClosingCta, CONTAINER } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight } from "@/components/site/icons";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";
import { GeoCivic, GeoCross, GeoColumns, GeoPlant } from "@/components/site/geo-art";

import { getSiteContent } from "@/lib/content";
import { isAnniversaryLive } from "@/lib/anniversary";

// Re-read CMS content (edited at /admin/content) at most once a minute, so
// admin edits go live without a rebuild while the page stays effectively static.
export const revalidate = 60;

const HOME_DESCRIPTION =
  "IT and engineering staffing, enterprise solutions, managed services and training for enterprises and state agencies. Certified MBE/WBE in Powell, Ohio.";

const HOME_TITLE = "Ocean Blue Corporation | IT Staffing & Enterprise Solutions";
const homeBase = pageMetadata({ path: "/", title: "IT Staffing & Enterprise Solutions", description: HOME_DESCRIPTION });

export const metadata: Metadata = {
  ...homeBase,
  title: { absolute: HOME_TITLE },
  openGraph: { ...homeBase.openGraph, title: HOME_TITLE },
  twitter: { ...homeBase.twitter, title: HOME_TITLE },
};

const HERO = {
  title: "The people and platforms enterprises rely on.",
  sub: "IT staffing, engineering, enterprise solutions, managed services and training for enterprises and government agencies, from one accountable partner.",
};

/** The five practices. Copy matches each practice page. */
const PRACTICES = [
  { href: "/solutions/staffing", name: "IT Staffing & Talent", body: "Vetted specialists who join your team and carry the work, on flexible or permanent terms.", image: IMG.serviceTalent },
  { href: "/solutions/engineering", name: "Engineering Talent", body: "Mechanical, electrical, aerospace and controls engineers, on your program.", image: IMG.serviceEngineering },
  { href: "/solutions", name: "Enterprise Solutions", body: "Cloud, security, ERP, Salesforce and production AI, shipped without stopping the business.", image: IMG.serviceSolutions },
  { href: "/solutions/managed", name: "Managed Services", body: "Monitoring, support and tuning around the clock, on one accountable SLA.", image: IMG.serviceManaged },
  { href: "/solutions/training", name: "Training & Upskilling", body: "Instructor-led training on the platforms your teams run, taught by practitioners.", image: IMG.serviceTraining },
];

const INDUSTRIES = [
  { name: "Government and public sector", body: "Staff augmentation and managed services for state agencies, from a certified MBE and WBE supplier.", Art: GeoCivic },
  { name: "Healthcare", body: "Cloud, data and application specialists for the systems that hold patient information.", Art: GeoCross },
  { name: "Financial services", body: "Security, data and platform engineers for regulated, always-on systems.", Art: GeoColumns },
  { name: "Manufacturing", body: "Mechanical, electrical and controls engineers alongside the IT that runs the plant.", Art: GeoPlant },
];

// The Organization node lives in the root layout; these page-level nodes give
// search engines the sitelinks and services graph.
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://oceanbluecorp.com/#website",
      url: "https://oceanbluecorp.com",
      name: "Ocean Blue Corporation",
      publisher: { "@id": "https://oceanbluecorp.com/#organization" },
      inLanguage: "en-US",
    },
    {
      "@type": "WebPage",
      "@id": "https://oceanbluecorp.com/#webpage",
      url: "https://oceanbluecorp.com",
      name: HOME_TITLE,
      isPartOf: { "@id": "https://oceanbluecorp.com/#website" },
      about: { "@id": "https://oceanbluecorp.com/#organization" },
      description: HOME_DESCRIPTION,
    },
    {
      "@type": "ItemList",
      name: "Solutions",
      itemListElement: [
        { name: "IT Staffing & Talent", url: "https://oceanbluecorp.com/solutions/staffing" },
        { name: "Engineering Talent & Services", url: "https://oceanbluecorp.com/solutions/engineering" },
        { name: "Enterprise Solutions", url: "https://oceanbluecorp.com/solutions" },
        { name: "Managed Services", url: "https://oceanbluecorp.com/solutions/managed" },
        { name: "Training & Upskilling", url: "https://oceanbluecorp.com/solutions/training" },
      ].map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
        url: s.url,
      })),
    },
  ],
};

export default async function Home() {
  const content = await getSiteContent("homepage");
  // Resolved on the server and passed down. A client component reading the
  // clock itself would let server and browser disagree across midnight and
  // break hydration.
  const anniversary = isAnniversaryLive(content);
  const title = content.heroTitle || HERO.title;
  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd) }} />

      {anniversary && <Anniversary content={content} />}

      {/* Hero */}
      <section className="on-dark relative overflow-hidden bg-[#0e2159]">
        <HeroNetwork />
        <div className={`relative ${CONTAINER} pt-40 pb-28 text-center sm:pt-52 sm:pb-36`}>
          <h1 className="mx-auto max-w-[980px] type-display text-white">
            {title.split(" ").map((w, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className="word" style={{ animationDelay: `${120 + i * 90}ms` }}>
                  {w}
                </span>
              </Fragment>
            ))}
          </h1>
          <p className="rise mx-auto mt-6 max-w-[660px] type-body-lg text-white/85" style={{ animationDelay: "520ms" }}>
            {content.heroSubtitle || HERO.sub}
          </p>
          <div className="rise mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: "640ms" }}>
            <LinkButton href="/contact" variant="inverse" size="lg">
              {content.heroCtaText || "Talk to us"}
            </LinkButton>
            <LinkButton href="/solutions" variant="outline-dark" size="lg">
              Explore solutions
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Clients: a strip, not a section */}
      <div className="border-b border-line bg-white">
        <div className={`${CONTAINER} py-12`}>
          <p className="text-center text-[14px] text-ink-subtle">Trusted by enterprises, public agencies and growing brands</p>
          <div className="mt-6">
            <CustomerMarquee />
          </div>
        </div>
      </div>

      <Section
        tone="paper"
        title="One partner for talent, technology and operations"
        sub="Start with a single hire or hand over a whole platform. Either way you work with one team, one contract and one person who answers for it."
        link={{ href: "/solutions", label: "View all solutions" }}
      >
        {/* Three across, then two wider: five cards without an orphan. */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {PRACTICES.map((p, i) => (
            <Link
              key={p.name}
              href={p.href}
              className={`group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-[border-color,box-shadow] duration-200 ease-[var(--ease-standard)] hover:border-line-strong hover:shadow-[var(--shadow-raised)] ${
                i < 3 ? "lg:col-span-2" : "lg:col-span-3"
              } ${i === 4 ? "sm:col-span-2 lg:col-span-3" : ""}`}
            >
              <div className={`relative w-full overflow-hidden bg-paper-deep ${i < 3 ? "aspect-[16/10]" : "aspect-[16/10] lg:aspect-[21/9]"}`}>
                <Photo
                  src={p.image}
                  sizes={i < 3 ? "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw"}
                  className="transition-transform duration-400 ease-[var(--ease-standard)] group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-7 sm:p-8">
                <h3 className="type-title-lg text-ink">{p.name}</h3>
                <p className="mt-2 max-w-md type-body-sm text-ink-muted">{p.body}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-7 text-[15px] font-semibold text-ink transition-colors group-hover:text-cobalt">
                  Learn more
                  <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <TechnologyPartnersBand />

      <Section
        tone="paper"
        title="Built for industries where the work has to hold"
        sub="Enterprises and public agencies bring us in where delivery, compliance and uptime all matter at once."
      >
        <ul className="grid gap-[3px] sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <li key={i.name} className="flex flex-col items-center bg-white px-6 pt-8 pb-9 text-center">
              <i.Art className="h-40 w-auto" />
              <h3 className="mt-6 type-title-lg text-ink">{i.name}</h3>
              <p className="mt-3 type-body-sm text-ink-muted">{i.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        tone="blue"
        title="Why clients keep working with us"
        sub="In their own words, from the people who have hired our teams."
      >
        <ClientVoices />
      </Section>

      <CertificationStrip />

      <ClosingCta />
    </div>
  );
}
