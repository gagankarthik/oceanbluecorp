"use client";

import Image from "next/image";
import {
  Palette, Users, Share2, Sparkles, ScanText, Receipt, Scale, Radar,
  GitBranch, LifeBuoy, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import { AccentHeading } from "@/components/landing/bands";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

/* The portfolio is two products that could not be less alike: a document
   intelligence platform sold to enterprises, and a consumer invitation service.
   The previous page gave them identical centred stages, which flattened the
   only genuinely interesting thing about the pair. Each now gets a split
   block, mirrored against the other, carrying the facts that differ.

   Both product images were removed. They were stock photographs of an unrelated
   analytics screen and an unrelated desk, captioned "Analytics running on the
   Blue-IQ platform" and "The Inytes platform in use", which asserts to a
   screen reader that a stranger's office is our product. A brand plate claims
   nothing. Swap in real screenshots when there are some and the plate can go. */

type Fact = { label: string; value: string };
type Feature = { icon: LucideIcon; label: string };

type Product = {
  id: string;
  name: string;
  category: string;
  /** The one line that says what it actually is. */
  tagline: string;
  desc: string;
  logo: string;
  /** Hotlinked rather than in /public, so it needs a plain <img>. */
  remote?: boolean;
  /** Identity only. Every control on this page stays cobalt. */
  tint: string;
  facts: Fact[];
  features?: Feature[];
  /** The product's own site. Absent when there is not one yet. */
  site?: string;
};

const products: Product[] = [
  {
    id: "blue-iq",
    name: "Blue-IQ",
    category: "Document intelligence",
    tagline: "We build the products that read your contracts.",
    desc: "Blue-IQ turns documents into structured data you can act on. Its Sonar engine reads PDFs, Word files, scans and phone photos, returns every field with a confidence score, and flags what it is unsure of instead of guessing, so a person reviews the handful of fields that need judgement rather than re-keying the whole page.",
    logo: "/logos/products/Blue-iq.png",
    tint: "#1d4ed8",
    facts: [
      { label: "What it does", value: "Turns documents into structured, scored data" },
      { label: "Built for", value: "Education, workforce, legal, finance and healthcare teams" },
      { label: "Reads", value: "PDF, DOCX, scans and phone photos" },
    ],
    features: [
      { icon: Radar, label: "Sonar engine, confidence-scored on every field" },
      { icon: ScanText, label: "Capture, any document into structured data" },
      { icon: Receipt, label: "Spend, reconciles invoices and entitlements" },
      { icon: Scale, label: "Govern, surfaces contract and compliance risk" },
    ],
    site: "https://www.blue-iq.ai/",
  },
  {
    id: "inytes",
    name: "Inytes",
    category: "Consumer platform",
    tagline: "Digital invitations for celebrations worth the paper.",
    desc: "A digital invitation platform for weddings, birthdays, baby showers, housewarmings and festivals, built for the Indian celebration market. Guests are invited, tracked and reminded in one place, and the card itself is designed rather than templated.",
    logo: "https://cdn.inytes.com/images/brand/inytes-logo.png",
    remote: true,
    tint: "#be185d",
    facts: [
      { label: "What it does", value: "Designs, sends and tracks event invitations" },
      { label: "Built for", value: "Weddings, birthdays, baby showers and festivals" },
      { label: "Sends over", value: "WhatsApp, SMS and social" },
    ],
    features: [
      { icon: Palette, label: "Event-specific design templates" },
      { icon: Users, label: "RSVP and guest tracking" },
      { icon: Share2, label: "Sharing over WhatsApp, SMS and social" },
      { icon: Sparkles, label: "Video and AI-generated invitations" },
    ],
    site: "https://www.inytes.com/",
  },
];

/* Applies to both products, which is the argument for owning them at all. */
const operating: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: GitBranch,
    title: "The same engineers",
    body: "Nobody is assigned to products because they were not good enough for client work. It is the same bench, and people move between the two.",
  },
  {
    icon: ShieldCheck,
    title: "The same review",
    body: "Our own platforms go through the code review, dependency and release process we ask of any codebase we are handed.",
  },
  {
    icon: LifeBuoy,
    title: "Run, not shipped and left",
    body: "Both are in production and stay our responsibility. Owning the pager is the part that teaches you what you built.",
  },
];

function ProductBlock({ p, index }: { p: Product; index: number }) {
  const flipped = index % 2 === 1;

  return (
    <section
      className={`w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24 ${
        index > 0 ? "border-t border-[var(--hz-line)]" : ""
      }`}
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Identity */}
        <Reveal className={`lg:col-span-5 ${flipped ? "lg:order-2" : ""}`}>
          <div
            className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl p-8 ring-1 ring-inset ring-black/[0.06] sm:p-12"
            style={{ background: `color-mix(in srgb, ${p.tint} 8%, #ffffff)` }}
          >
            <div className="flex w-full max-w-[22rem] items-center justify-center rounded-xl bg-white px-8 py-10 shadow-[0_1px_2px_rgba(4,10,24,0.04),0_12px_32px_-12px_rgba(4,10,24,0.16)]">
            {p.remote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt={`${p.name} logo`} className="max-h-20 w-auto max-w-full object-contain" />
            ) : (
              <Image
                src={p.logo}
                alt={`${p.name} logo`}
                width={480}
                height={480}
                className="max-h-20 w-auto max-w-full object-contain"
              />
            )}
            </div>
          </div>

          <dl className="mt-8 divide-y divide-[var(--hz-line)] border-t border-[var(--hz-line)]">
            {p.facts.map((f) => (
              <div key={f.label} className="grid grid-cols-5 gap-4 py-3.5">
                <dt className="col-span-2 text-caption text-[var(--hz-text-subtle)]">{f.label}</dt>
                <dd className="col-span-3 text-small text-[var(--hz-text)]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Substance */}
        <Reveal delay={0.08} className={`lg:col-span-7 ${flipped ? "lg:order-1" : ""}`}>
          <span className="hz-eyebrow text-[var(--hz-text-subtle)]">{p.category}</span>

          <h2 className="hz-display mt-4 text-[1.9rem] sm:text-[2.1rem] leading-tight text-[var(--hz-text)] sm:text-[2.6rem]">
            {p.name}
          </h2>
          <p className="hz-display mt-3 max-w-[24ch] text-[1.35rem] leading-snug" style={{ color: p.tint }}>
            {p.tagline}
          </p>
          <p className="mt-6 max-w-[58ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
            {p.desc}
          </p>

          {p.features && (
            <ul className="mt-9 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {p.features.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <span
                    className="grid h-8 w-8 flex-none place-items-center rounded-lg"
                    style={{
                      background: `color-mix(in srgb, ${p.tint} 10%, #ffffff)`,
                      color: p.tint,
                    }}
                  >
                    <f.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="pt-1 text-small leading-relaxed text-[var(--hz-text-mute)]">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* One control, and only where it leads somewhere. A product without
              a public site gets the ask that IS useful. */}
          <div className="mt-10">
            {p.site ? (
              <Cta href={p.site} variant="primary">Visit {p.name}</Cta>
            ) : (
              <Cta href="/contact" variant="ghostLight">Talk to us about {p.name}</Cta>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function ProductsPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Our products"
        title="Products we build, ship, and stand behind."
        subtitle="Beyond client delivery, we invest in our own platforms, the same engineering rigor applied to products we own end to end."
        image={IMG.productsHero}
      />

      {/* Opening position: why a services company owns software at all. */}
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="w-full">
          <AccentHeading>The portfolio</AccentHeading>
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:gap-16">
            <p className="text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
              Two platforms in production, and they have almost nothing in
              common. One reads contracts and invoices for enterprise teams.
              The other sends wedding invitations.
            </p>
            <p className="text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              That gap is the point. A company that only staffs projects never
              has to live with its own decisions. Owning two products, in two
              markets, on two very different footings, is how we find out
              whether the way we build actually holds up.
            </p>
          </div>
        </Reveal>
      </section>

      {products.map((p, i) => (
        <ProductBlock key={p.id} p={p} index={i} />
      ))}

      {/* What is true of both, which is the argument for owning them. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">How both are run.</h2>
        </Reveal>
        <Stagger as="ul" className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-3 lg:gap-12" gap={0.07}>
          {operating.map((o) => (
            <StaggerItem as="li" key={o.title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                <o.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="hz-display mt-5 text-[1.2rem] leading-tight text-[var(--hz-text)]">
                {o.title}
              </h3>
              <p className="mt-3 max-w-[46ch] text-small leading-relaxed text-[var(--hz-text-mute)]">
                {o.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* The one photograph on the page, and it is what it says it is. */}
      <section className="w-full border-t border-[var(--hz-line)]">
        <div className="relative isolate w-full overflow-hidden">
          <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
            <Photo
              src={IMG.aboutTeam}
              alt="Ocean Blue engineers working together in the office"
              sizes="100vw"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(4,10,24,0.86) 0%, rgba(4,10,24,0.60) 46%, rgba(4,10,24,0.20) 76%, transparent 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center px-6 sm:px-10 lg:px-16 2xl:px-24">
              <Reveal className="max-w-xl">
                <p className="hz-display text-[1.5rem] leading-snug text-white sm:text-[2rem]">
                  The people who build our products are the people we would put
                  on yours.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-t border-[var(--hz-line)] px-6 py-20 sm:px-10 sm:py-24 lg:px-16 2xl:px-24">
        <Reveal className="max-w-3xl">
          <h2 className="hz-display max-w-[18ch] text-[clamp(2rem,5vw,3.4rem)] leading-[1.03] text-[var(--hz-text)]">
            Have a product to build or scale?
          </h2>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[18px]">
            We bring the team that designs, ships, and runs software in production.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Cta href="/contact" variant="primary">Start a conversation</Cta>
            <Cta href="/solutions" variant="ghostLight">Explore solutions</Cta>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
