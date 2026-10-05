import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { Band, Section, ClosingCta } from "@/components/site/sections";
import { IconLinkedin } from "@/components/site/company/icons";
import { IconCheck } from "@/components/site/icons";

/* Team is a ROSTER. The page's whole job is "who are these people", so the
   leadership wall comes first and carries the page.

   Monogram tiles, not avatar circles: we have no photographs of these people,
   and a stock face standing in for a named individual would be a lie. Large
   initials read as a deliberate treatment; a tiny circle reads as a gap. */

const LEADERSHIP = [
  { name: "Sarojini Gude", role: "President", initials: "SG", linkedin: "" },
  { name: "Brent Wallace", role: "SVP, Workforce Solutions", initials: "BW", linkedin: "https://www.linkedin.com/in/brentwallace1/" },
  { name: "Sushma Moturu", role: "Human Resource Director", initials: "SM", linkedin: "https://www.linkedin.com/in/sushma-moturu-4ba752236/" },
  { name: "Clark Cristofoli", role: "Executive Recruiter", initials: "CC", linkedin: "https://www.linkedin.com/in/clark-cristofoli-0402b988/" },
];

const OPERATING = [
  { title: "Senior by default", desc: "Engagements are led by people who have done the work before, not learning on your time." },
  { title: "Accountable end to end", desc: "One team owns the outcome, from the first conversation to the quarterly review." },
  { title: "No black boxes", desc: "Clear communication and collaborative execution, with a standing account of where things stand." },
];

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Our team"
        title="The people behind the work."
        subtitle="Senior practitioners who lead from the front, and a delivery bench that integrates with your team from day one."
        image={IMG.teamHero}
      />

      <Section tone="white" title="Leadership" sub="The people accountable for the work, and the ones you will actually be dealing with.">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERSHIP.map((l) => (
            <li key={l.name} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              <span
                aria-hidden
                className="grid aspect-[4/3] w-full place-items-center border-b border-line bg-paper text-[64px] leading-none font-semibold tracking-[-0.04em] text-brand [background-image:linear-gradient(to_right,rgb(11_26_51/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(11_26_51/0.05)_1px,transparent_1px)] [background-size:28px_28px]"
              >
                {l.initials}
              </span>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="type-title text-ink">{l.name}</h3>
                <p className="mt-1 text-[15px] text-ink-muted">{l.role}</p>
                {/* Only where a profile exists: a LinkedIn mark that goes nowhere is worse than none. */}
                {l.linkedin && (
                  <a
                    href={l.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-2 self-start pt-5 type-label font-semibold text-ink transition-colors hover:text-cobalt"
                  >
                    <IconLinkedin size={17} />
                    LinkedIn
                    <span className="sr-only"> profile for {l.name}</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* How the team operates: the promise on the left, three numbered rows on the right. */}
      <Band muted>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <h2 className="reveal type-headline text-ink lg:col-span-5">
            A team you can hold to the outcome
          </h2>
          <ol className="reveal divide-y divide-line border-y border-line lg:col-span-7">
            {OPERATING.map((o) => (
              <li key={o.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-5 py-7">
                <IconCheck size={20} className="mt-1 text-brand" />
                <div>
                  <h3 className="type-title-lg text-ink">{o.title}</h3>
                  <p className="mt-1.5 max-w-[56ch] type-body-sm text-ink-muted">{o.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Band>

      <ClosingCta
        title="Build your career with our team"
        sub="We hire for the same disciplines we place, and the people we hire carry real scope from the first week."
        primary={{ href: "/careers", label: "View open roles" }}
        secondary={{ href: "/about", label: "About Oceanblue" }}
      />
    </>
  );
}
