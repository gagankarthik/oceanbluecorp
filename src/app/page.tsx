import type { Metadata } from "next";
import { jsonLdString, pageMetadata } from "@/lib/seo";
import { Fragment } from "react";
import { CustomerMarquee } from "@/components/site/customer-marquee";
import { ClientVoices } from "@/components/site/client-voices";
import { PracticeShowcase } from "@/components/site/practice-showcase";
import { CredentialsBand } from "@/components/site/credentials";
import { Section, ClosingCta, CONTAINER } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { LineGrid } from "@/components/site/line-grid";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { IconArrowRight } from "@/components/site/icons";
import { ArtCapitol, ArtHealth, ArtFinance, ArtFactory } from "@/components/site/industry-art";

import { getSiteContent } from "@/lib/content";

// Re-read CMS content (edited at /admin/content) at most once a minute, so
// admin edits go live without a rebuild while the page stays effectively static.
export const revalidate = 60;

const HOME_DESCRIPTION =
  "IT and engineering staffing, enterprise solutions, managed services and training for enterprises and state agencies. Certified MBE/WBE in Powell, Ohio.";

const HOME_TITLE = "Oceanblue Solutions, Inc. | IT Staffing & Enterprise Solutions";
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

const INDUSTRIES = [
  { name: "Government and public sector", body: "Staff augmentation and managed services for state agencies, from a certified MBE and WBE supplier.", Art: ArtCapitol },
  { name: "Healthcare", body: "Cloud, data and application specialists for the systems that hold patient information.", Art: ArtHealth },
  { name: "Financial services", body: "Security, data and platform engineers for regulated, always-on systems.", Art: ArtFinance },
  { name: "Manufacturing", body: "Mechanical, electrical and controls engineers alongside the IT that runs the plant.", Art: ArtFactory },
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
      name: "Oceanblue Solutions, Inc.",
      alternateName: ["Oceanblue Solutions", "Oceanblue"],
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
  const title = content.heroTitle || HERO.title;
  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd) }} />

      {/* Hero: navy with beams running along the line grid. */}
      <section className="on-dark relative isolate overflow-hidden bg-night">
        <HeroBackdrop />
        <div className={`${CONTAINER} pt-36 pb-24 text-center sm:pt-48 sm:pb-32`}>
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
          <p className="rise mx-auto mt-6 max-w-[660px] type-body-lg text-white/80" style={{ animationDelay: "520ms" }}>
            {content.heroSubtitle || HERO.sub}
          </p>
          <div className="rise mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: "640ms" }}>
            <LinkButton href="/contact" variant="inverse" size="lg">
              {content.heroCtaText || "Talk to us"}
              <IconArrowRight size={16} />
            </LinkButton>
            <LinkButton href="/solutions" variant="outline-dark" size="lg">
              Explore solutions
            </LinkButton>
          </div>
        </div>
      </section>

      <CustomerMarquee label="Trusted by enterprises, public agencies and growing brands." />

      <Section
        tone="paper"
        title="One partner for talent, technology and operations"
        sub="Start with a single hire or hand over a whole platform. Either way you work with one team, one contract and one person who answers for it."
        kicker="Solutions"
        link={{ href: "/solutions", label: "Explore all solutions" }}
      >
        <PracticeShowcase />
      </Section>

      <CredentialsBand />

      <Section
        tone="paper"
        kicker="Industries"
        title="Built for industries where the work has to hold"
        sub="Enterprises and public agencies bring us in where delivery, compliance and uptime all matter at once."
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((ind) => (
            <li
              key={ind.name}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[var(--shadow-raised)]"
            >
              <div className="relative isolate flex h-56 items-center justify-center overflow-hidden border-b border-line bg-cobalt-tint">
                <LineGrid />
                <ind.Art className="h-44 w-auto" />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="type-title-lg text-ink">{ind.name}</h3>
                <p className="mt-2 max-w-[52ch] type-body-sm text-ink-muted">{ind.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        tone="blue"
        notched
        ground="paper"
        below="none"
        title="Why clients keep working with us"
        sub="In their own words, from the people who have hired our teams."
      >
        <ClientVoices />
      </Section>

      <ClosingCta tuck />
    </div>
  );
}
