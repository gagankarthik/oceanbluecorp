import type { Metadata } from "next";
import FaqList from "@/components/site/FaqList";
import { faqsFor } from "@/lib/faqs";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import ManyIntoOne from "@/components/visuals/ManyIntoOne";
import StepIcon from "@/components/visuals/StepIcons";
import { models, reasons, steps } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  path: "/how-we-work",
  title: "How We Work",
  description:
    "Every engagement runs through discovery, strategy, implementation and optimization, on contract, direct-hire, project team or managed services terms.",
});

const ledger = [
  { item: "Contracts to manage", stack: "One per vendor", us: "One" },
  { item: "Numbers to call", stack: "One per vendor", us: "One team, one number" },
  { item: "Who watches the systems", stack: "Whoever's contract covers that part", us: "We do, with monitoring around the clock" },
  { item: "Service level agreements", stack: "Several, none covering the gaps", us: "One, covering all of it" },
  { item: "Who owns the outcome", stack: "Each vendor points at the next", us: "We do" },
];

/** One header pattern for every section: title left, short intro right */
function Head({ id, title, intro, soft = "text-mist-600" }: { id: string; title: string; intro: string; soft?: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <h2 id={id} className="display text-head lg:col-span-6" data-reveal>
        {title}
      </h2>
      <p className={`max-w-measure-narrow lg:col-span-5 lg:col-start-8 lg:self-end ${soft}`} data-reveal style={{ "--d": 1 } as React.CSSProperties}>
        {intro}
      </p>
    </div>
  );
}

const tableHead = "pb-3 pr-6 font-medium";
const tableCell = "py-4 pr-6";

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        cells={[{ photo: "bridge" }, { tone: "bg-tide-200" }, { photo: "facade" }, { tone: "bg-navy-900" }]}
        lines={["How we work"]}
        standfirst="Whichever practice leads the work, you know what happens next, who owns it and how it will be judged."
        side={<p>Discovery, strategy, implementation and optimization, with success measures agreed up front.</p>}
      />

      <section aria-labelledby="stages-title" className="bg-field-paper">
        <div className="gutter pb-24 md:pb-32">
          <Head
            id="stages-title"
            title="Four stages, every engagement"
            intro="Whichever service leads, the work moves through the same stages, each with an outcome both sides agree on."
          />
          <ol className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.name} className="flex flex-col bg-mist-100 p-6 md:p-7" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                  <span className="grid size-14 shrink-0 place-items-center bg-mist-0">
                    <StepIcon step={s.name} className="size-11" />
                  </span>
                  <h3 className="display min-w-0 text-title">{s.name}</h3>
                </div>
                <p className="mt-5">{s.body}</p>
                <ul className="mt-6 grid gap-3 border-t border-mist-300 pt-6 text-small text-mist-600">
                  {s.detail.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-ocean-600" />
                      {d}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="partner-title" className="bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <Head
            id="partner-title"
            title="Why one accountable partner"
            intro="Usually each need is a different vendor, a different contract and a different phone number. When something goes wrong, they point at each other."
          />
          <div className="mt-14 bg-mist-0 p-6 md:p-10" data-reveal>
            <ManyIntoOne />
          </div>
          {/* Oceanblue's column is the filled one; the alternative stays muted */}
          <div className="mt-10 overflow-x-auto overflow-y-hidden" data-reveal>
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <caption className="sr-only">Several vendors compared with Oceanblue</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[28%] p-5">
                    <span className="sr-only">Question</span>
                  </th>
                  <th scope="col" className="w-[33%] bg-mist-200 p-5 text-body font-semibold text-mist-700">
                    Several vendors
                  </th>
                  <th scope="col" className="bg-ocean-600 p-5 text-body font-semibold text-white">
                    <span className="flex items-center gap-2">
                      <svg aria-hidden viewBox="0 0 20 20" className="size-5 text-cyan-300" fill="currentColor">
                        <path d="M10 1.5 12.6 7l6 .7-4.4 4.1 1.2 5.9L10 14.8l-5.4 2.9 1.2-5.9L1.4 7.7l6-.7Z" />
                      </svg>
                      Oceanblue
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((r, i) => {
                  const lastRow = i === ledger.length - 1;
                  return (
                    <tr key={r.item} className="align-top">
                      <th scope="row" className={`p-5 font-semibold text-navy-900 ${lastRow ? "" : "border-b border-mist-300"}`}>{r.item}</th>
                      <td className={`bg-mist-0 p-5 text-mist-600 ${lastRow ? "" : "border-b border-mist-200"}`}>
                        <span className="flex gap-3">
                          <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mist-200 text-mist-600">
                            <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 3l6 6M9 3 3 9" />
                            </svg>
                          </span>
                          {r.stack}
                        </span>
                      </td>
                      <td className={`bg-ocean-600 p-5 font-medium text-white ${lastRow ? "" : "border-b border-ocean-500"}`}>
                        <span className="flex gap-3">
                          <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white text-ocean-700">
                            <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="m2.5 6.2 2.3 2.3 4.7-5" />
                            </svg>
                          </span>
                          {r.us}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="models-title" className="bg-field-paper">
        <div className="gutter py-24 md:py-32">
          <Head
            id="models-title"
            title="Engagement models"
            intro="Five ways to work with us, from one specialist on your team to a team that owns the outcome."
          />
          <div className="mt-14 overflow-x-auto overflow-y-hidden" data-reveal>
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-navy-900">
                  <th scope="col" className={tableHead}>Model</th>
                  <th scope="col" className={tableHead}>Who directs the work</th>
                  <th scope="col" className={tableHead}>Who owns the outcome</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.name} className="border-b border-mist-300 align-baseline last:border-0">
                    <th scope="row" className={`${tableCell} w-[45%] font-normal`}>
                      <span className="block text-title font-semibold">{m.name}</span>
                      <span className="mt-1 block max-w-measure-narrow text-small text-mist-600">{m.body}</span>
                    </th>
                    <td className={tableCell}>{m.direct}</td>
                    <td className={tableCell}>{m.owns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FaqList title="Questions clients ask" items={faqsFor("Working with us", "Talent and delivery")} here="/how-we-work" tone="mist" />

      <section aria-labelledby="reasons-title" className="on-dark bg-navy-900 text-mist-50">
        <div className="gutter py-24 md:py-32">
          <Head
            id="reasons-title"
            title="Why clients choose us"
            intro="What stays the same whichever service you buy."
            soft="text-tide-300"
          />
          <dl className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <div key={r.title} className="flex flex-col-reverse justify-end bg-navy-800 p-6 md:p-7" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <dd className="mt-2 text-tide-300">{r.body}</dd>
                <dt className="text-title font-semibold text-white">{r.title}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Closing />
    </>
  );
}
