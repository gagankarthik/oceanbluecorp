import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import { LinkButton } from "@/components/site/button";
import { Band, Section, ClosingCta, CONTAINER, SECTION_Y } from "@/components/site/sections";
import { IconArrowRight, IconCheck } from "@/components/site/icons";
import { SOLUTIONS, SOLUTION_ORDER } from "./content";

/* A single practice. The reader already knows which one they want, so the
   page answers "what exactly do you cover" first, then what they get, then
   how it is delivered. Siblings sit at the foot as an exit, not content. */

function relatedLinks(current: string) {
  const rows = SOLUTION_ORDER.filter((s) => s !== current).map((s) => ({
    title: SOLUTIONS[s].eyebrow,
    href: `/solutions/${s}`,
  }));
  rows.push({ title: "Engineering Talent & Services", href: "/solutions/engineering" });
  return rows;
}

export default function ServiceDetail({ slug }: { slug: string }) {
  const data = SOLUTIONS[slug];

  return (
    <>
      <PageHero
        eyebrow={data.eyebrow}
        title={data.title}
        subtitle={data.lede}
        image={data.image}
        actions={
          <>
            <LinkButton href="/contact" variant="primary" size="lg">
              Talk to us
            </LinkButton>
            <LinkButton href="/solutions" variant="outline" size="lg">
              All solutions
            </LinkButton>
          </>
        }
      />

      {/* Overview, with the ways to engage beside it. */}
      <Band>
        <div className="reveal grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="type-headline text-ink">{data.overviewHeading}</h2>
            <p className="mt-6 max-w-[62ch] type-body-lg text-ink-muted">{data.overviewBody}</p>
          </div>
          {data.tags && (
            <div className="self-start rounded-2xl border border-line bg-paper p-7">
              <p className="text-[14px] font-semibold text-ink">Ways to engage</p>
              <ul className="mt-4 divide-y divide-line">
                {data.tags.map((t) => (
                  <li key={t} className="flex items-center gap-3 py-3 text-[15px] text-ink-muted">
                    <IconCheck size={16} className="flex-none text-cobalt" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Band>

      {/* The scope sheet: the question this page exists to answer. */}
      <Section tone="paper" title="What we cover" sub={`The ${data.capabilities.length} capabilities this practice delivers.`}>
        <ul className="grid gap-[3px] bg-line sm:grid-cols-2 lg:grid-cols-3">
          {data.capabilities.map((c, i) => (
            <li key={c} className="flex items-start gap-4 bg-white p-6 sm:p-7">
              <span className="pt-0.5 text-[13px] font-semibold text-cobalt tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="type-body font-medium text-ink">{c}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="white" title="What you get">
        <ul className="grid gap-[3px] bg-line md:grid-cols-3">
          {data.highlights.map((h) => (
            <li key={h.title} className="bg-white p-8">
              <span className="flex size-10 items-center justify-center rounded-lg border border-line text-ink">
                <IconCheck size={18} />
              </span>
              <h3 className="mt-6 type-title-lg text-ink">{h.title}</h3>
              <p className="mt-2 type-body-sm text-ink-muted">{h.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Delivery as a numbered rail: one line, four stops. */}
      <Section tone="paper" title="How we deliver">
        <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-line-strong md:block" />
          {data.approach.map((st, i) => (
            <li key={st.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative flex size-10 flex-none items-center justify-center rounded-full border border-line-strong bg-white text-[14px] font-semibold text-ink tabular-nums">
                {i + 1}
              </span>
              <div>
                <h3 className="type-title text-ink md:mt-5">{st.title}</h3>
                <p className="mt-1.5 type-body-sm text-ink-muted">{st.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Siblings: an exit, not a section. */}
      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={CONTAINER}>
          <h2 className="type-title text-ink">Explore more solutions</h2>
          <ul className="mt-5 grid gap-x-8 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
            {relatedLinks(data.slug).map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="group flex items-center justify-between gap-4 border-b border-line py-3.5 text-[15px] font-medium text-ink-muted transition-colors hover:text-cobalt">
                  {r.title}
                  <IconArrowRight size={15} className="flex-none text-ink-subtle transition-all group-hover:translate-x-1 group-hover:text-cobalt" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingCta
        title={`Talk to us about ${data.eyebrow}`}
        sub="Tell us the outcome you need. We will put the right people on it and stand behind the result."
        primary={{ href: "/contact", label: "Talk to us" }}
        secondary={{ href: "/solutions", label: "All solutions" }}
      />
    </>
  );
}
