import type { Metadata } from "next";
import MoreLink from "@/components/site/MoreLink";
import Link from "next/link";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import ManyIntoOne from "@/components/visuals/ManyIntoOne";
import ServicesOverview from "@/components/visuals/ServicesOverview";
import WaveField from "@/components/visuals/WaveField";
import { MarkTile, certMarks, clientMarks, partnerMarks } from "@/components/site/LogoWall";
import Quotes from "@/components/site/Quotes";
import { industries, services } from "@/lib/site-content";
import { ORG_ID, SITE_URL, WEBSITE_ID, jsonLdString, pageMetadata } from "@/lib/seo";

const HOME_TITLE = "Oceanblue Solutions, Inc. | IT Staffing & Enterprise Solutions";
const HOME_DESCRIPTION =
  "IT and engineering staffing, enterprise solutions, managed services and training for enterprises and state agencies. Certified MBE/WBE in Powell, Ohio.";
const homeBase = pageMetadata({ path: "/", title: "IT Staffing & Enterprise Solutions", description: HOME_DESCRIPTION });

export const metadata: Metadata = {
  ...homeBase,
  title: { absolute: HOME_TITLE },
  openGraph: { ...homeBase.openGraph, title: HOME_TITLE },
  twitter: { ...homeBase.twitter, title: HOME_TITLE },
};

// The Organization node lives in the root layout; these add the site, the page and the services list.
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: "Oceanblue Solutions, Inc.",
      alternateName: ["Oceanblue Solutions", "Oceanblue"],
      publisher: { "@id": ORG_ID },
      inLanguage: "en-US",
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: HOME_TITLE,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORG_ID },
      description: HOME_DESCRIPTION,
    },
    {
      "@type": "ItemList",
      name: "Services",
      itemListElement: services.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
        url: `${SITE_URL}/services/${s.slug}`,
      })),
    },
  ],
};

const without = [
  "Separate contracts for staffing, cloud, security and support",
  "A different number to call for every problem",
  "Gaps between service level agreements that nobody owns",
  "Vendors pointing at each other when something breaks",
];

const withUs = [
  "One contract for people, platforms and operations",
  "One number to call: (614) 844-6925",
  "One service level agreement, reviewed with you every quarter",
  "One accountable lead who answers for the outcome",
];

const problems = [
  {
    need: "A project needs people you can't hire fast enough",
    service: "IT staffing and engineering talent",
    answer: "Vetted engineers who join your team and own the work, with a matched shortlist within 48 hours.",
    href: "/services/it-staffing",
  },
  {
    need: "A platform has to move without stopping the business",
    service: "Cloud, ERP, Salesforce, data and AI",
    answer: "Migration and modernization in planned, reversible steps, with security and cost control built in.",
    href: "/services/cloud-engineering",
  },
  {
    need: "A working system needs someone awake at 2 a.m.",
    service: "Managed services",
    answer: "Monitoring, helpdesk, patching and infrastructure, around the clock, on one service level agreement.",
    href: "/services/managed-services",
  },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd) }} />

      {/* Hero: a two-by-two board */}
      <section id="top" aria-label="Introduction" className="bg-field-paper p-2">
        <div className="grid gap-2 md:h-[calc(100svh-88px)] md:min-h-[38rem] md:grid-cols-2 md:grid-rows-[1.25fr_1fr]">
          <div className="@container relative flex flex-col justify-end overflow-hidden bg-mist-0 p-6 md:col-start-1 md:row-start-1 md:p-8 lg:p-10">
            <WaveField />
            <h1 className="lines display relative whitespace-nowrap text-[clamp(1.5rem,7.2cqi,4.25rem)] leading-[1.02]">
              <span className="line">
                <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                  The people and platforms
                </span>
              </span>
              <span className="line">
                <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                  enterprises rely on.
                </span>
              </span>
            </h1>
            <div data-after-lines className="relative">
              <p className="mt-5 max-w-[46ch] text-[clamp(1.0625rem,1.2vw,1.25rem)] leading-snug text-mist-600">
                IT and engineering talent, cloud, security, ERP, data, managed services and training from one accountable team.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.98]"
                >
                  Talk to us
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex min-h-12 items-center px-6 font-medium text-navy-900 ring-2 ring-inset ring-navy-900 transition-colors hover:bg-navy-900 hover:text-white active:scale-[0.98]"
                >
                  Find a job
                </Link>
              </div>
            </div>
          </div>
          <div className="shutter aspect-[4/3] md:col-start-2 md:row-span-2 md:row-start-1 md:aspect-auto">
            <Photo name="tower" priority className="h-full" position="28% 50%" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-start-1 md:row-start-2">
            <Link
              href="/services/it-staffing"
              className="@container group flex min-h-56 flex-col justify-between gap-6 bg-navy-900 p-5 text-mist-50 transition-colors hover:bg-navy-800 md:min-h-0 md:p-7"
            >
              <span className="text-[15px] text-tide-300">For hiring managers</span>
              <span>
                <span className="display block text-[clamp(1.5rem,11cqi,2.75rem)] leading-[1.05]">A shortlist in 48 hours</span>
                <span className="mt-3 block text-[15px] text-tide-300 group-hover:text-white">Vetted engineers, matched to the role</span>
              </span>
            </Link>
            <Link
              href="/services"
              className="@container group flex min-h-56 flex-col justify-between gap-6 bg-ocean-600 p-5 text-white transition-colors hover:bg-ocean-700 md:min-h-0 md:p-7"
            >
              <span className="text-[15px]">For technology leaders</span>
              <span>
                <span className="display block text-[clamp(1.5rem,11cqi,2.75rem)] leading-[1.05]">One team, one contract</span>
                <span className="mt-3 block text-[15px]">People, platforms and operations</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Clients, directly under the hero */}
      <section aria-labelledby="clients-title" className="bg-field-paper px-2 pb-2">
        <div className="bg-mist-100 px-5 py-10 md:px-8">
          <h2 id="clients-title" className="text-[clamp(1.25rem,1.6vw,1.5rem)] font-medium">
            Trusted by enterprises and public agencies
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {clientMarks.map((m) => (
              <MarkTile key={m.name} mark={m} />
            ))}
          </ul>
        </div>
      </section>

      {/* The problem, and what we do about it */}
      <section aria-labelledby="problem-title" className="bg-field-paper">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="problem-title" className="display text-[clamp(2.25rem,4vw,3.75rem)] lg:col-span-6" data-reveal>
              How we help
            </h2>
            <div className="max-w-[44ch] text-[clamp(1.125rem,1.3vw,1.25rem)] leading-snug lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              <p>
                Usually each of these is a different vendor, a different contract and a different phone number. We do all of it, as one
                team, under one contract.
              </p>
              <MoreLink href="/services" label="All services" inline className="mt-2" />
            </div>
          </div>

          <ul className="mt-14 grid gap-2">
            {problems.map((p, i) => (
              <li key={p.need} data-reveal style={{ "--d": i } as React.CSSProperties}>
                <Link
                  href={p.href}
                  className="group grid gap-6 bg-mist-100 p-6 transition-colors hover:bg-tide-100 md:p-8 lg:grid-cols-12 lg:items-center"
                >
                  <span className="display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.1] lg:col-span-5">{p.need}</span>
                  <span className="lg:col-span-5 lg:col-start-7">
                    <span className="block text-[15px] font-medium text-ocean-700">{p.service}</span>
                    <span className="mt-1 block">{p.answer}</span>
                  </span>
                  <span className="lg:col-span-1 lg:col-start-12 lg:justify-self-end">
                    <span className="sr-only">Learn more about {p.service}</span>
                    <span
                      aria-hidden
                      className="grid size-12 place-items-center rounded-full bg-mist-0 text-ocean-700 ring-1 ring-inset ring-ocean-200 transition-[background-color,color,transform] duration-300 group-hover:translate-x-1 group-hover:bg-ocean-600 group-hover:text-white"
                    >
                      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 10h12M11 5l5 5-5 5" />
                      </svg>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* A band of two photographs */}
      <section aria-hidden className="grid h-[34svh] grid-cols-3 gap-2 bg-field-paper px-2 md:h-[52svh]">
        <Photo name="facade" className="h-full" sizes="33vw" position="50% 40%" />
        <Photo name="bridge" className="h-full" sizes="33vw" />
        <Photo name="lattice" className="h-full" sizes="33vw" />
      </section>

      {/* Services overview */}
      <ServicesOverview />

      {/* Industries we serve */}
      <section aria-labelledby="industries-title" className="bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="industries-title" className="display text-[clamp(2.25rem,4vw,3.5rem)] lg:col-span-7" data-reveal>
              Industries we serve
            </h2>
            <p className="max-w-[44ch] lg:col-span-4 lg:col-start-9 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              Sectors where delivery, compliance and uptime all matter at once, and where a vendor that disappears after the contract is
              signed is not an option.
            </p>
          </div>
          <ul className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {industries.map((ind, i) => (
              <li key={ind.slug} data-reveal style={{ "--d": i } as React.CSSProperties}>
                <Link href={`/industries#${ind.slug}`} className="group flex h-full flex-col bg-mist-0 transition-colors hover:bg-tide-100">
                  <Photo
                    name={ind.photo}
                    className="aspect-[4/3]"
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    position={ind.photo === "plant" ? "0% 50%" : "center"}
                    zoom
                  />
                  <span className="flex flex-1 flex-col p-5">
                    <span className="text-[19px] font-semibold leading-snug text-navy-900 group-hover:text-ocean-700">{ind.name}</span>
                    <span className="mt-2 flex-1 text-[15px] leading-relaxed text-mist-600">{ind.body.split(".")[0]}.</span>
                    <span className="relative mt-4 w-fit text-[15px] font-medium text-ocean-700">
                      See how we help
                      <span
                        aria-hidden
                        className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
                      />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <MoreLink href="/industries" label="All industries" className="mt-8" />
        </div>
      </section>

      {/* Why one accountable partner: a comparison */}
      <section aria-labelledby="many-heading" className="bg-field-paper">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="many-heading" className="display text-[clamp(2.25rem,4vw,3.5rem)] lg:col-span-7" data-reveal>
              Why one accountable partner
            </h2>
            <div className="max-w-[44ch] lg:col-span-4 lg:col-start-9 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              <p>
                When something breaks, the real choice is between one team that owns the outcome and several vendors pointing at each
                other.
              </p>
              <MoreLink href="/how-we-work" label="How we work" inline className="mt-2" />
            </div>
          </div>

          <div className="mt-14 grid gap-2 lg:grid-cols-2">
            <div className="flex flex-col bg-mist-100 p-7 md:p-10" data-reveal>
              <h3 className="display text-[clamp(1.5rem,2.2vw,2.25rem)] text-mist-700">Working with several vendors</h3>
              <ul className="mt-8 grid gap-4">
                {without.map((t) => (
                  <li key={t} className="flex gap-4 text-mist-700">
                    <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mist-200 text-mist-600">
                      <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 3l6 6M9 3 3 9" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col bg-ocean-600 p-7 text-white md:p-10" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              <h3 className="display text-[clamp(1.5rem,2.2vw,2.25rem)]">One partner for all of it</h3>
              <ul className="mt-8 grid gap-4">
                {withUs.map((t) => (
                  <li key={t} className="flex gap-4">
                    <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white text-ocean-700">
                      <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m2.5 6.2 2.3 2.3 4.7-5" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center bg-white px-6 font-medium text-navy-950 transition-colors hover:bg-cyan-100 active:scale-[0.98]"
                >
                  Talk to us
                </Link>
                <Link
                  href="/how-we-work"
                  className="inline-flex min-h-12 items-center px-6 font-medium text-white ring-2 ring-inset ring-white transition-colors hover:bg-white hover:text-navy-950 active:scale-[0.98]"
                >
                  How we work
                </Link>
              </div>
            </div>
          </div>

          {/* Each idea carries its own slice of the drawing */}
          <ol className="mt-2 grid gap-2 md:grid-cols-3">
            {(
              [
                { name: "Several vendors", body: "Separate contracts, separate numbers, and gaps nobody owns.", part: "loose" },
                { name: "One team", body: "People, platforms and operations under one contract and one lead.", part: "ribbon" },
                { name: "Ordered delivery", body: "Short increments, then run and improved against one SLA.", part: "ordered" },
              ] as const
            ).map((x, i) => (
              <li key={x.name} className="flex flex-col bg-mist-100 p-6 md:p-7" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <ManyIntoOne part={x.part} className="h-36 w-full md:h-40" />
                <p className="mt-6 text-[18px] font-semibold">{x.name}</p>
                <p className="mt-1.5 text-mist-600">{x.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Certifications and platform partners: two panels */}
      <section aria-labelledby="proof-title" className="bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <h2 id="proof-title" className="display max-w-[20ch] text-[clamp(2.25rem,4vw,3.75rem)]" data-reveal>
            Certifications and partnerships
          </h2>

          <div className="mt-12 grid gap-2 lg:grid-cols-2">
            <div className="flex flex-col bg-mist-0 p-6 md:p-8" data-reveal>
              <h3 className="text-[clamp(1.375rem,1.8vw,1.75rem)] font-medium">Supplier-diversity certifications</h3>
              <p className="mt-2 max-w-[48ch] text-mist-600">
                Minority-owned and women-owned, certified at national, state and city level. Work placed with us counts toward your
                diversity goals.
              </p>
              <ul className="mt-8 grid flex-1 grid-cols-2 gap-2">
                {certMarks.map((m) => (
                  <li key={m.name} title={m.name} className="flex h-36 items-center justify-center bg-mist-100 px-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.src} alt={m.name} className={`${m.h} w-auto max-w-[85%] object-contain mix-blend-multiply`} loading="lazy" />
                  </li>
                ))}
              </ul>
              <Link href="/certifications" className="mt-6 w-fit font-medium text-ocean-700 underline underline-offset-4">
                What each certification covers
              </Link>
            </div>

            <div className="flex flex-col bg-mist-0 p-6 md:p-8" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              <h3 className="text-[clamp(1.375rem,1.8vw,1.75rem)] font-medium">Technology partners</h3>
              <p className="mt-2 max-w-[48ch] text-mist-600">
                Our cloud, data and AI work runs on the platforms our clients use, so you get people who already know the stack.
              </p>
              <ul className="mt-8 grid flex-1 grid-cols-2 gap-2">
                {partnerMarks.map((m, i) => (
                  <li
                    key={m.name}
                    title={m.name}
                    className={`flex h-36 items-center justify-center bg-mist-100 px-5 ${i === 0 ? "col-span-2" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.src} alt={m.name} className={`${m.h} w-auto max-w-[85%] object-contain mix-blend-multiply`} loading="lazy" />
                  </li>
                ))}
              </ul>
              <Link href="/certifications#partners-title" className="mt-6 w-fit font-medium text-ocean-700 underline underline-offset-4">
                About our partnerships
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Quotes more={{ href: "/resources/customer-stories", label: "Customer stories" }} />

      <Closing />
    </>
  );
}
