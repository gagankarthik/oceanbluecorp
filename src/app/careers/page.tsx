import type { Metadata } from "next";
import FaqList from "@/components/site/FaqList";
import { faqsFor } from "@/lib/faqs";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Photo from "@/components/site/Photo";
import BenefitIcon from "@/components/visuals/BenefitIcons";
import HireIcon from "@/components/visuals/HireIcons";
import { company } from "@/lib/site-content";
import { getOpenJobs } from "@/lib/jobs";
import { jobFacts } from "@/lib/job-facts";
import { CAREER_BENEFITS, EEO_STATEMENT } from "@/lib/careers";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/careers",
  title: "IT Jobs & Careers",
  description:
    "Find IT, engineering and consulting jobs with Oceanblue Solutions, Inc. Contract, contract-to-hire and direct-hire roles across the US, including remote positions.",
});

/** Company facts, never open-role counts */
const facts = [
  { value: "50+", label: "Team members" },
  { value: "4", label: "Global offices" },
  { value: "8", label: "Practice areas" },
  { value: "2013", label: "Building since" },
];

const reasons = [
  {
    title: "Work that matters to the client",
    body: "Our people join enterprise and public-sector teams and own real work: migrations, platforms, plants and the systems people rely on every day.",
  },
  {
    title: "Someone in your corner",
    body: "We stay accountable for everyone we place for the length of the engagement. If something is not working, you have one person to call.",
  },
  {
    title: "Professional growth",
    body: "Training, mentorship and certification preparation, on projects that are current rather than legacy maintenance.",
  },
  {
    title: "Work-life balance",
    body: "Contract, contract-to-hire and direct-hire roles, on-site, hybrid or remote, with flexible arrangements that respect your time outside work.",
  },
];

/** Practices we hire for. `q` opens the job board as a keyword search; empty opens all of it. */
const practices = [
  { name: "IT Staffing", body: "Recruiters and delivery leads placing specialists", q: "" },
  { name: "Cloud Services", body: "AWS, Azure and GCP migration and platform work", q: "cloud" },
  { name: "Engineering", body: "Mechanical, electrical, controls and manufacturing", q: "engineer" },
  { name: "ERP Solutions", body: "SAP, Oracle and Microsoft Dynamics", q: "erp" },
  { name: "Data & AI", body: "Data engineering, analytics and production ML", q: "data" },
  { name: "Salesforce", body: "Apex, LWC and managed administration", q: "salesforce" },
  { name: "PMO", body: "Programme and project delivery across accounts", q: "project" },
  { name: "Training", body: "Enablement for client and internal teams", q: "training" },
];

const workplaces = [
  { city: "Powell, Ohio", country: "United States", note: "headquarters" },
  { city: "Hyderabad", country: "India", note: "delivery center" },
  { city: "Vizianagaram", country: "India", note: "delivery center" },
  { city: "London", country: "United Kingdom", note: "office" },
];

const hiring = [
  { name: "Apply or send your resume", body: "Apply to an opening, or send your resume and tell us what you are looking for." },
  { name: "A conversation with a recruiter", body: "We learn your experience, the work you want and how you like to work." },
  { name: "A technical conversation", body: "An engineer who does the work talks through the skills the role needs." },
  { name: "Meet the client", body: "We put you forward only for roles that fit, and prepare you for the client conversation." },
];

export const revalidate = 60;

export default async function CareersPage() {
  const jobs = await getOpenJobs();
  const latest = jobs.slice(0, 4);

  return (
    <>
      <PageHero
        cells={[{ photo: "bridge" }, { tone: "bg-ocean-600" }, { photo: "facade" }, { tone: "bg-navy-900" }, { photo: "lattice" }]}
        lines={["Careers at", "Oceanblue"]}
        standfirst="Engineers, developers, analysts and architects who join client teams and own the work. Find a role that fits how you want to work."
        side={
          <div className="grid gap-4">
            <Link
              href="/jobs"
              className="inline-flex min-h-12 w-fit items-center bg-ocean-600 px-6 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
            >
              Find a job
            </Link>
            <a href="#life" className="w-fit text-navy-900 underline underline-offset-4">
              What it is like here
            </a>
          </div>
        }
      />

      <section aria-label="Oceanblue in numbers" className="bg-field-paper">
        <div className="gutter pb-24 md:pb-32">
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {facts.map((f, i) => (
              <div key={f.label} className="flex flex-col-reverse bg-mist-100 px-6 py-8" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <dt className="mt-2 text-mist-600">{f.label}</dt>
                <dd className="display text-head-xl tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="life" aria-labelledby="life-title" className="scroll-mt-24 bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side order-2 lg:order-none" data-reveal>
            <Photo name="typing" className="aspect-[4/5]" />
          </div>
          <div className="axis">
            <h2 id="life-title" className="display text-head" data-reveal>
              What it is like here
            </h2>
            <p className="mt-6 max-w-measure-narrow text-title leading-snug" data-reveal>
              Our engineers are embedded with the client and accountable for the outcome, so you carry real scope from the first week and you see
              what your work changed.
            </p>
            <dl className="mt-12 grid gap-x-12 gap-y-12 sm:grid-cols-2">
              {reasons.map((r, i) => (
                <div key={r.title} data-reveal style={{ "--d": i % 2 } as React.CSSProperties}>
                  <dt className="text-title font-medium">{r.title}</dt>
                  <dd className="mt-2 max-w-measure-narrow">{r.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="practices-title" className="bg-field-mist">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="practices-title" className="display text-head">
              Find the team you belong on
            </h2>
            <p className="mt-6 max-w-measure-narrow text-mist-600">
              We place engineers, recruiters and delivery leads with enterprises and government agencies across North America, and we hire for
              the same disciplines ourselves.
            </p>
            <Link href="/jobs" className="mt-6 inline-block font-medium text-ocean-700 underline underline-offset-4">
              Browse every role
            </Link>

            {/* For anyone who can't place themselves in a practice yet */}
            <div className="on-dark mt-10 bg-ocean-600 p-6 text-white md:p-7">
              <h3 className="text-title font-semibold">Not sure where to start?</h3>
              <p className="mt-2 text-ocean-50">
                Tell us what you do and the work you want. A recruiter will point you to the right team, or keep your details for the next role
                that fits.
              </p>
              <Link
                href="/contact?for=work"
                className="mt-5 inline-flex min-h-12 items-center bg-white px-5 font-medium text-navy-950 btn-fill btn-fill-white active:scale-[0.98]"
              >
                Talk to a recruiter
              </Link>
              <ul className="mt-5 grid gap-1 text-small">
                <li>
                  <a href={company.tel} className="underline underline-offset-4 hover:text-cyan-100">
                    {company.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${company.email}?subject=Career%20enquiry`} className="underline underline-offset-4 hover:text-cyan-100">
                    {company.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <ul className="axis grid gap-2 sm:grid-cols-2">
            {practices.map((p, i) => (
              <li key={p.name} data-reveal style={{ "--d": i % 2 } as React.CSSProperties}>
                <Link
                  href={p.q ? `/jobs?q=${encodeURIComponent(p.q)}` : "/jobs"}
                  className="group flex h-full flex-col bg-mist-0 p-6 transition-colors hover:bg-tide-100"
                >
                  <span className="text-title font-medium group-hover:text-ocean-700">{p.name}</span>
                  <span className="mt-1 text-mist-600">{p.body}</span>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-small font-medium text-ocean-700">
                    See open roles
                    <svg aria-hidden viewBox="0 0 20 20" className="size-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10h12M11 5l5 5-5 5" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="hire-title" className="on-dark bg-navy-900 text-mist-50">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="hire-title" className="display text-head lg:col-span-6" data-reveal>
              How we hire
            </h2>
            <p className="max-w-measure-narrow text-tide-300 lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              Four steps from first message to first day, with a recruiter beside you at each one.
            </p>
          </div>
          <ol className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {hiring.map((h, i) => (
              <li key={h.name} className="flex flex-col bg-navy-800 p-6 md:p-7" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <span className="grid size-16 place-items-center bg-mist-0">
                  <HireIcon step={h.name} className="size-12" />
                </span>
                <p className="mt-6 text-title font-semibold text-white">{h.name}</p>
                <p className="mt-2 text-tide-300">{h.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="offer-title" className="bg-field-paper">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="offer-title" className="display text-head lg:col-span-6" data-reveal>
              What we offer
            </h2>
            <p className="max-w-measure-narrow text-mist-600 lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              The benefits, and the places you could be doing the work.
            </p>
          </div>

          <dl className="mt-14 grid gap-2 md:grid-cols-3">
            {CAREER_BENEFITS.map((b, i) => (
              <div key={b.title} className="bg-mist-100 p-6 md:p-7" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <dt className="flex items-center gap-4 text-title font-semibold">
                  <span className="grid size-16 shrink-0 place-items-center bg-mist-0">
                    <BenefitIcon benefit={b.title} className="size-12" />
                  </span>
                  {b.title}
                </dt>
                <dd className="mt-4 text-mist-600">{b.desc}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-2 bg-mist-100 p-6 md:p-8" data-reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-head-sm font-semibold">Where we work</h3>
                <p className="mt-2 max-w-measure text-mist-600">
                  Four offices across three countries, with roles in all of them, and remote roles across the United States.
                </p>
              </div>
              <Link href="/jobs?q=remote" className="font-medium text-ocean-700 underline underline-offset-4">
                See remote roles
              </Link>
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {workplaces.map((w) => (
                <li key={w.city} className="bg-mist-0 p-5">
                  <p className="text-title font-semibold">{w.city}</p>
                  <p className="mt-1 text-small text-mist-600">
                    {w.country}, {w.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="on-dark mt-2 bg-navy-900 p-6 text-mist-50 md:p-8" data-reveal>
            <h3 className="text-head-sm font-semibold">An equal opportunity employer</h3>
            <p className="mt-3 max-w-measure text-tide-300">
              A supportive, inclusive workplace where every voice is heard. {EEO_STATEMENT} Need an accommodation during hiring? Tell your recruiter and we will arrange it.
            </p>
            <Link href="/equal-opportunity" className="mt-5 inline-block font-medium text-white underline underline-offset-4 hover:text-cyan-300">
              Read our full statement
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-field-mist">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 className="display text-head">Latest openings</h2>
            <Link href="/jobs" className="mt-6 inline-block font-medium text-ocean-700 underline underline-offset-4">
              {jobs.length ? "See all openings" : "Browse the job board"}
            </Link>
          </div>
          <ul className="axis grid gap-2">
            {latest.map((j, i) => (
              <li key={j.slug} data-reveal style={{ "--d": i } as React.CSSProperties}>
                <Link href={`/jobs/${j.slug}`} className="group flex flex-wrap items-center justify-between gap-4 bg-mist-0 p-6 transition-colors hover:bg-tide-100">
                  <span>
                    <span className="display block text-head-sm [overflow-wrap:anywhere] group-hover:text-ocean-700">{j.title}</span>
                    <span className="mt-1 block text-small text-mist-600">
                      {jobFacts({ ...j, practice: "" }).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0">
                  <span className="sr-only">View {j.title}</span>
                  <span
                    aria-hidden
                    className="grid size-12 place-items-center rounded-full bg-mist-100 text-ocean-700 ring-1 ring-inset ring-ocean-200 transition-[background-color,color,transform] duration-300 group-hover:translate-x-1 group-hover:bg-ocean-600 group-hover:text-white"
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

      <FaqList title="Questions candidates ask" items={faqsFor("Careers")} here="/careers" />

      <section className="on-dark bg-ocean-600 text-white">
        <div className="gutter flex flex-col items-center gap-10 py-20 text-center md:py-24">
          <div data-reveal>
            <h2 className="display text-head">
              Ready to join
              <br />
              our team?
            </h2>
            <p className="mx-auto mt-6 max-w-measure-narrow">
              See what is open right now, or{" "}
              <a href={`mailto:${company.email}?subject=Resume`} className="underline underline-offset-4 hover:text-cyan-100">
                send us your resume
              </a>{" "}
              and we will keep it on file for roles that match.
            </p>
          </div>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row" data-reveal>
            <Link
              href="/jobs"
              className="inline-flex min-h-13 items-center justify-center whitespace-nowrap bg-white px-7 font-medium text-navy-950 btn-fill btn-fill-white active:scale-[0.98]"
            >
              View open positions
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-13 items-center justify-center whitespace-nowrap bg-navy-900 px-7 font-medium text-white btn-fill btn-fill-navy active:scale-[0.98]"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
