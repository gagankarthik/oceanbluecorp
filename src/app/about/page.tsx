import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import OfficeClocks from "@/components/visuals/OfficeClocks";
import StoryTimeline from "@/components/visuals/StoryTimeline";
import { MarkTile, clientMarks } from "@/components/site/LogoWall";
import { company, leadership, offices } from "@/lib/site-content";
import { ORG_ID, SITE_URL, jsonLdString, pageMetadata } from "@/lib/seo";
import Quotes from "@/components/site/Quotes";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About Us",
  description:
    "Since 2013, Oceanblue Solutions, Inc. has supplied IT talent, enterprise solutions and managed services to enterprises and state agencies from Powell, Ohio.",
});

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

// The leadership team as Person nodes tied to the root Organization.
const leadershipJsonLd = {
  "@context": "https://schema.org",
  "@graph": leadership.map((l) => ({
    "@type": "Person",
    "@id": `${SITE_URL}/about#${l.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: l.name,
    jobTitle: l.role,
    worksFor: { "@id": ORG_ID },
    ...(l.linkedin ? { sameAs: [l.linkedin] } : {}),
  })),
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(leadershipJsonLd) }} />
      <PageHero
        cells={[{ photo: "facade" }, { tone: "bg-ocean-600" }, { photo: "bridge" }, { tone: "bg-tide-200" }, { photo: "tower", position: "50% 70%" }]}
        lines={["About", "Oceanblue"]}
        standfirst={`${company.name} was founded in Powell, Ohio on ${company.founded}. Today we serve enterprises and state agencies across North America.`}
        side={<p>Minority-owned and women-owned. Four offices in the United States, India and the United Kingdom.</p>}
      />

      <section className="bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <Photo name="glassOffice" className="aspect-[4/5]" />
          </div>
          <div className="axis" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            <p className="max-w-measure-narrow text-head-sm leading-[1.3] [text-indent:3em]">{company.mission}</p>
            <p className="mt-10 max-w-measure">
              Technology should make people&apos;s work simpler, not give them a second job managing it. We help organizations modernize the
              systems they already run and strengthen the teams around them.
            </p>
            <p className="mt-4 max-w-measure">
              We are a minority-owned and women-owned business, and we hold the certifications that prove it. Many of the organizations we work
              with, public agencies in particular, have supplier-diversity commitments they must meet and report on. Working with us lets them
              meet those commitments with a capable delivery partner.{" "}
              <Link href="/certifications" className="font-medium text-ocean-700 underline underline-offset-4">
                Our certifications
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="story-title" className="bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="story-title" className="display text-head lg:col-span-6" data-reveal>
              Our story
            </h2>
            <p className="max-w-measure-narrow lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              From a single office in Powell, Ohio in 2013 to four offices in the United States, India and the United Kingdom.
            </p>
          </div>
          <div className="mt-16">
            <StoryTimeline />
          </div>
        </div>
      </section>

      <section id="leadership" aria-labelledby="leadership-title" className="scroll-mt-24 bg-field-paper">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="leadership-title" className="display text-head lg:col-span-6" data-reveal>
              Leadership
            </h2>
            <p className="max-w-measure-narrow lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              The people accountable for the work, and the ones you will actually be dealing with.
            </p>
          </div>
          <ul className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((l, i) => (
              <li key={l.name} className="flex flex-col bg-mist-100 p-6" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <span aria-hidden className="display grid size-14 place-items-center bg-tide-200 text-head-sm text-ocean-700">
                  {initials(l.name)}
                </span>
                <div className="mt-6 flex flex-1 flex-col">
                  <h3 className="text-title font-semibold text-navy-900">{l.name}</h3>
                  <p className="mt-1 text-mist-600">{l.role}</p>
                  {l.linkedin && (
                    <a
                      href={l.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex min-h-10 items-center gap-2 self-start pt-5 text-small font-medium text-ocean-700 underline-offset-4 hover:underline"
                    >
                      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
                        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.76-2.06 4.02 0 4.76 2.65 4.76 6.09v5.47h-4v-4.85c0-1.16-.02-2.65-1.61-2.65-1.62 0-1.87 1.26-1.87 2.56v4.94h-4v-11Z" />
                      </svg>
                      LinkedIn
                      <span className="sr-only"> profile for {l.name}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="places-title" className="on-dark bg-navy-900 text-mist-50">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="places-title" className="display side text-head" data-reveal>
              Our locations
            </h2>
            <p className="axis max-w-measure-narrow self-end text-tide-300" data-reveal>
              Powell, Hyderabad, Vizianagaram and London. The time right now at each: between them, someone is nearly always at work.
            </p>
          </div>
          <div className="mt-14">
            <OfficeClocks />
          </div>
          <ul className="mt-2 grid gap-2 sm:grid-cols-3">
            {offices.map((o) => (
              <li key={o.place}>
                <Photo name={o.photo} className="aspect-[3/2]" sizes="33vw" />
              </li>
            ))}
          </ul>
          <Link href="/contact#locations" className="mt-8 inline-block font-medium text-white underline underline-offset-4 hover:text-tide-200">
            Addresses and phone numbers
          </Link>
        </div>
      </section>

      <Quotes />

      <section aria-labelledby="clients-title" className="bg-field-mist">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="clients-title" className="display text-head-md">
              Our clients
            </h2>
            <p className="mt-4 max-w-measure-narrow text-mist-600">
              A state agency, a global technology company, restaurant groups and a wholesaler. Different sectors, the same arrangement: one
              team, one contact, accountable for the work.
            </p>
          </div>
          <ul className="axis grid grid-cols-2 gap-2 md:grid-cols-3" data-reveal>
            {clientMarks.map((m) => (
              <MarkTile key={m.name} mark={m} />
            ))}
          </ul>
        </div>
      </section>

      <Closing
        lines={["Work with a team", "that owns the outcome"]}
        sentence="Tell us what you are trying to change and we will tell you, plainly, whether we are the right people for it."
      />
    </>
  );
}
