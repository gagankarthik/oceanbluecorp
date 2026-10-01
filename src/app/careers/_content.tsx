import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";
import { CAREER_BENEFITS } from "@/lib/careers";
import { CountUp } from "@/components/ui/count-up";
import { LinkButton } from "@/components/site/button";
import { Section, ClosingCta, CONTAINER } from "@/components/site/sections";
import {
  IconArrowRight, IconTalent, IconCloudUp, IconHardHat, IconLayers, IconChip, IconCrm, IconGraduation, type Icon,
} from "@/components/site/icons";
import {
  IconChecklist, IconGrowth, IconBalance, IconInclusive, IconHealth, IconSavings, IconTimeOff, IconScale, IconPin,
} from "@/components/site/careers/careers-icons";

/* Careers: why work here, what we offer, and a clear route to the board.

   Everything traces to a real source:
     facts + offices    the contact page and company record
     departments        the filter list on /careers/search
     culture + benefits copy supplied and confirmed by the business
     EEO statement      pre-existing legal copy
   Anything stated here should be something a new hire can hold us to. */

// `from` keeps the founding year counting over a short run, not from zero.
const FACTS = [
  { to: 50, suffix: "+", k: "Team members" },
  { to: 4, k: "Global offices" },
  { to: 8, k: "Practice areas" },
  { to: 2013, from: 1995, k: "Building since" },
];

/* Each tile opens the board as a keyword search. Departments on postings are
   free text set by recruiters ("Information and Computers"), so filtering on
   these names returned nothing; a keyword matches titles and descriptions.
   `q` empty opens the whole board. */
const DEPARTMENTS: { name: string; icon: Icon; blurb: string; q: string }[] = [
  { name: "IT Staffing", icon: IconTalent, blurb: "Recruiters and delivery leads placing specialists", q: "" },
  { name: "Cloud Services", icon: IconCloudUp, blurb: "AWS, Azure and GCP migration and platform work", q: "cloud" },
  { name: "Engineering", icon: IconHardHat, blurb: "Mechanical, electrical, controls and manufacturing", q: "engineer" },
  { name: "ERP Solutions", icon: IconLayers, blurb: "SAP, Oracle and Microsoft Dynamics", q: "erp" },
  { name: "Data & AI", icon: IconChip, blurb: "Data engineering, analytics and production ML", q: "data" },
  { name: "Salesforce", icon: IconCrm, blurb: "Apex, LWC and managed administration", q: "salesforce" },
  { name: "PMO", icon: IconChecklist, blurb: "Programme and project delivery across accounts", q: "project" },
  { name: "Training", icon: IconGraduation, blurb: "Enablement for client and internal teams", q: "training" },
];

const CULTURE: { title: string; desc: string; icon: Icon }[] = [
  { title: "Professional growth", icon: IconGrowth, desc: "Training, mentorship, and work on projects that are current rather than legacy maintenance." },
  { title: "Work-life balance", icon: IconBalance, desc: "Flexible working arrangements and a culture that respects your time outside work." },
  { title: "Inclusive environment", icon: IconInclusive, desc: "A supportive workplace where every voice is heard and diversity is celebrated." },
];

const BENEFIT_ICONS: Icon[] = [IconHealth, IconSavings, IconTimeOff];
const BENEFITS = CAREER_BENEFITS.map((b, i) => ({ ...b, icon: BENEFIT_ICONS[i] }));

const OFFICES = [
  { city: "Powell, Ohio", country: "United States" },
  { city: "Hyderabad", country: "India" },
  { city: "Vizianagaram", country: "India" },
  { city: "London", country: "United Kingdom" },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Own the work, not a ticket queue."
        subtitle="We place engineers, recruiters and delivery leads with enterprises and government agencies across North America, and we hire for the same disciplines ourselves."
        image={IMG.heroSlides[1]}
        actions={
          <>
            <LinkButton href="/careers/search" variant="primary" size="lg">
              View open positions
              <IconArrowRight size={16} />
            </LinkButton>
            <LinkButton href="#life" variant="outline" size="lg">
              What it is like here
            </LinkButton>
          </>
        }
      />

      {/* Four facts as a quiet strip, not a headline. */}
      <div className="bg-white pb-12 sm:pb-16">
        <div className={CONTAINER}>
          <dl className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.k} className="flex flex-col-reverse items-center bg-white px-4 py-8 text-center sm:py-10">
                <dt className="mt-2 type-body-sm text-ink-subtle">{f.k}</dt>
                <dd className="type-headline font-semibold text-ink tabular-nums">
                  <span className="sr-only">
                    {f.to}
                    {f.suffix}
                  </span>
                  <span aria-hidden>
                    <CountUp to={f.to} from={f.from} digitEffect="blur" duration={1.6} />
                    {f.suffix}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Section
        tone="paper"
        title="Find the team you belong on"
        sub="Eight practices, all hiring. Pick the one that matches what you do and see what is open right now."
        link={{ href: "/careers/search", label: "Browse every role" }}
      >
        <ul className="grid gap-[3px] sm:grid-cols-2 lg:grid-cols-4">
          {DEPARTMENTS.map((d) => (
            <li key={d.name}>
              <Link
                href={d.q ? `/careers/search?q=${encodeURIComponent(d.q)}` : "/careers/search"}
                className="group flex h-full min-h-[210px] flex-col bg-white p-7 transition-colors hover:bg-paper-deep/40"
              >
                <span className="flex size-10 items-center justify-center rounded-lg border border-line text-ink transition-colors group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white">
                  <d.icon size={18} />
                </span>
                <h3 className="mt-5 type-title-lg font-semibold text-ink">{d.name}</h3>
                <p className="mt-1.5 type-body-sm text-ink-muted">{d.blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 type-label font-semibold text-ink transition-colors group-hover:text-cobalt">
                  See open roles
                  <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="life"
        tone="white"
        title="What it is like here"
        sub="Our engineers are embedded with the client and accountable for the outcome, which means you carry real scope from the first week and you see what your work changed."
      >
        {/* A mosaic at three sizes, so the block reads as a place rather than a row of identical frames. */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-paper-deep lg:col-span-7 lg:row-span-2 lg:aspect-auto">
            <Photo src={IMG.serviceTalent} alt="An Ocean Blue team working together" sizes="(min-width: 1024px) 700px, 100vw" />
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-paper-deep lg:col-span-5">
            <Photo src={IMG.serviceEngineering} alt="An engineer at work on a test rig" sizes="(min-width: 1024px) 500px, 100vw" />
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-paper-deep lg:col-span-5">
            <Photo src={IMG.aboutTeam} alt="An Ocean Blue team meeting" sizes="(min-width: 1024px) 500px, 100vw" />
          </div>
        </div>

        <ul className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-3">
          {CULTURE.map((c) => (
            <li key={c.title}>
              <c.icon size={24} className="text-cobalt" />
              <h3 className="mt-4 type-title-lg font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 max-w-[40ch] type-body text-ink-muted">{c.desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="paper" title="What we offer" sub="The benefits and the places you could be doing the work.">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ul className="grid gap-[3px]">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-5 bg-white p-7">
                <b.icon size={24} className="mt-0.5 shrink-0 text-cobalt" />
                <div>
                  <h3 className="type-title-lg font-semibold text-ink">{b.title}</h3>
                  <p className="mt-1.5 max-w-[52ch] type-body text-ink-muted">{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-line bg-white p-7">
              <h3 className="type-title-lg font-semibold text-ink">Where we work</h3>
              <p className="mt-1.5 type-body text-ink-muted">Four offices across three countries, and roles in all of them.</p>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {OFFICES.map((o) => (
                  <li key={o.city} className="flex items-center justify-between gap-4 py-3">
                    <span className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
                      <IconPin size={16} className="text-ink-subtle" />
                      {o.city}
                    </span>
                    <span className="type-body-sm text-ink-subtle">{o.country}</span>
                  </li>
                ))}
              </ul>
              <Link href="/careers/search?remote=1" className="mt-5 inline-flex items-center gap-1.5 type-label font-semibold text-ink transition-colors hover:text-cobalt">
                See remote roles
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-2xl border border-line bg-white p-7">
              <IconScale size={22} className="text-cobalt" />
              <h3 className="mt-3 type-title font-semibold text-ink">An equal opportunity employer</h3>
              <p className="mt-2 type-body-sm text-ink-muted">
                We do not discriminate on the basis of race, color, religion, sex, sexual orientation, gender identity, national origin,
                disability, or veteran status. Need an accommodation during hiring? Tell your recruiter and we will arrange it.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <ClosingCta
        title="Ready to join our team?"
        sub="See what is open right now, or send us your resume and we will keep it on file for roles that match."
        primary={{ href: "/careers/search", label: "View open positions" }}
        secondary={{ href: "/contact", label: "Get in touch" }}
      />
    </>
  );
}
