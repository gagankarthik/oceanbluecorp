import Image from "next/image";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { Band, SectionTitle, ClosingCta, CONTAINER, SECTION_Y } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight, IconExternal } from "@/components/site/icons";
import { GeoStack } from "@/components/site/geo-art";
import { cn } from "@/lib/utils";

/* The portfolio is two products that could not be less alike: a document
   intelligence platform sold to enterprises, and a consumer invitation service.
   Each gets a split block, mirrored against the other, carrying the facts that
   differ.

   Product imagery is a brand plate, not a stock screenshot: a stranger's
   office captioned as our product would assert something untrue. Swap in real
   screenshots when there are some. */

type Fact = { label: string; value: string };

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
  facts: Fact[];
  features: string[];
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
    facts: [
      { label: "What it does", value: "Turns documents into structured, scored data" },
      { label: "Built for", value: "Education, workforce, legal, finance and healthcare teams" },
      { label: "Reads", value: "PDF, DOCX, scans and phone photos" },
    ],
    features: [
      "Sonar engine, confidence-scored on every field",
      "Capture, any document into structured data",
      "Spend, reconciles invoices and entitlements",
      "Govern, surfaces contract and compliance risk",
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
    facts: [
      { label: "What it does", value: "Designs, sends and tracks event invitations" },
      { label: "Built for", value: "Weddings, birthdays, baby showers and festivals" },
      { label: "Sends over", value: "WhatsApp, SMS and social" },
    ],
    features: [
      "Event-specific design templates",
      "RSVP and guest tracking",
      "Sharing over WhatsApp, SMS and social",
      "Video and AI-generated invitations",
    ],
    site: "https://www.inytes.com/",
  },
];

/* Applies to both products, which is the argument for owning them at all. */
const operating = [
  {
    title: "The same engineers",
    body: "Nobody is assigned to products because they were not good enough for client work. It is the same bench, and people move between the two.",
  },
  {
    title: "The same review",
    body: "Our own platforms go through the code review, dependency and release process we ask of any codebase we are handed.",
  },
  {
    title: "Run, not shipped and left",
    body: "Both are in production and stay our responsibility. Owning the pager is the part that teaches you what you built.",
  },
];

function ProductBlock({ p, index }: { p: Product; index: number }) {
  const flipped = index % 2 === 1;

  return (
    <section id={p.id} data-tone={flipped ? "paper" : "white"} className={cn("scroll-mt-28", flipped ? "bg-paper" : "bg-white", SECTION_Y)}>
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-12 lg:gap-16")}>
        {/* Identity */}
        <div className={cn("reveal lg:col-span-5", flipped && "lg:order-2")}>
          <div className={cn("flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-line p-10", flipped ? "bg-white" : "bg-paper")}>
            {p.remote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt={`${p.name} logo`} className="max-h-20 w-auto max-w-[80%] object-contain" />
            ) : (
              <Image src={p.logo} alt={`${p.name} logo`} width={480} height={480} className="max-h-20 w-auto max-w-[80%] object-contain" />
            )}
          </div>

          <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {p.facts.map((f) => (
              <div key={f.label} className="grid grid-cols-5 gap-4 px-5 py-4">
                <dt className="col-span-2 type-body-sm text-ink-subtle">{f.label}</dt>
                <dd className="col-span-3 type-body text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Substance */}
        <div className={cn("reveal lg:col-span-7", flipped && "lg:order-1")}>
          <p className="type-label font-semibold text-cobalt">{p.category}</p>
          <h2 className="mt-3 type-headline-lg font-semibold text-ink">{p.name}</h2>
          <p className="mt-3 max-w-[30ch] type-title-lg font-medium text-ink">{p.tagline}</p>
          <p className="mt-6 max-w-[60ch] type-body-lg text-ink-muted">{p.desc}</p>

          <ul className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-3 bg-white p-5 type-body text-ink-muted">
                <span aria-hidden className="mt-2 size-1.5 flex-none rounded-full bg-cobalt" />
                {f}
              </li>
            ))}
          </ul>

          {/* One control, and only where it leads somewhere. */}
          <div className="mt-10">
            {p.site ? (
              <a
                href={p.site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-cobalt bg-cobalt px-6 text-[15.5px] font-semibold text-white transition-colors hover:bg-cobalt-deep"
              >
                Visit {p.name}
                <IconExternal size={16} />
              </a>
            ) : (
              <LinkButton href="/contact" variant="outline" size="lg">
                Talk to us about {p.name}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our products"
        title="Products we build, ship, and stand behind."
        subtitle="Beyond client delivery, we invest in our own platforms, the same engineering rigor applied to products we own end to end."
        image={IMG.productsHero}
        actions={
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-4 type-label font-semibold text-ink transition-colors hover:border-cobalt"
              >
                {p.name}
                <IconArrowRight size={14} className="rotate-90" />
              </a>
            ))}
          </div>
        }
      />

      {/* Why a services company owns software at all. */}
      <Band>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div className="reveal">
            <h2 className="type-headline font-semibold text-ink">The portfolio</h2>
            <p className="mt-6 type-body-lg text-ink">
              Two platforms in production, and they have almost nothing in common. One reads contracts and invoices for enterprise teams. The other
              sends wedding invitations.
            </p>
            <p className="mt-5 type-body-lg text-ink-muted">
              That gap is the point. A company that only staffs projects never has to live with its own decisions. Owning two products, in two
              markets, on two very different footings, is how we find out whether the way we build actually holds up.
            </p>
          </div>
          <div aria-hidden className="reveal hidden items-center justify-center rounded-2xl bg-paper p-10 lg:flex">
            <GeoStack className="h-auto w-full max-w-[300px]" />
          </div>
        </div>
      </Band>

      {products.map((p, i) => (
        <ProductBlock key={p.id} p={p} index={i} />
      ))}

      {/* What is true of both, which is the argument for owning them. */}
      <Band>
        <SectionTitle title="How both are run" sub="The people who build our products are the people we would put on yours." />
        <ul className="reveal mt-10 grid gap-[3px] sm:mt-12 md:grid-cols-3">
          {operating.map((o) => (
            <li key={o.title} className="bg-paper p-8">
              <h3 className="type-title-lg font-semibold text-ink">{o.title}</h3>
              <p className="mt-2 type-body text-ink-muted">{o.body}</p>
            </li>
          ))}
        </ul>
      </Band>

      <ClosingCta
        title="Have a product to build or scale?"
        sub="We bring the team that designs, ships, and runs software in production."
        primary={{ href: "/contact", label: "Talk to us" }}
        secondary={{ href: "/solutions", label: "Explore solutions" }}
      />
    </>
  );
}
