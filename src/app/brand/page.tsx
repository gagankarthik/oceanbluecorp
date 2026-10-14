/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/brand",
  title: "Brand Guidelines",
  description:
    "The Oceanblue Solutions, Inc. brand: logo files, the colour palette built from the two logo blues, and how each colour is used on light and dark fields.",
});

const chapterFields = [
  { name: "Paper", token: "field-paper", hex: "#F5F8FA", use: "Default ground, forms, reading", cls: "bg-field-paper text-navy-900" },
  { name: "Mist", token: "field-mist", hex: "#EAF1F4", use: "One step from paper, for a second light chapter", cls: "bg-field-mist text-navy-900" },
  { name: "Shallow", token: "field-shallow", hex: "#C9E4EF", use: "People. The lightest coloured field", cls: "bg-field-shallow text-navy-950" },
  { name: "Cyan", token: "field-cyan", hex: "#0CAACF", use: "Logo cyan. Accent, contact sentences", cls: "bg-field-cyan text-navy-950" },
  { name: "Brand", token: "field-brand", hex: "#0A72C0", use: "Logo blue. Platforms, the home hero", cls: "bg-field-brand text-white" },
  { name: "Deep", token: "field-deep", hex: "#0B2E46", use: "Operations, product, running ink", cls: "bg-field-deep text-mist-50" },
  { name: "Abyss", token: "field-abyss", hex: "#061A28", use: "Footer and closing fields", cls: "bg-field-abyss text-mist-50" },
];

const scales: { name: string; steps: [string, string][] }[] = [
  { name: "Ocean (logo blue)", steps: [["50", "#eaf4fb"], ["100", "#d2e8f7"], ["200", "#a6d0ef"], ["300", "#6fb2e3"], ["400", "#3794d4"], ["500", "#1580c8"], ["600", "#0a72c0"], ["700", "#085c9c"], ["800", "#0a4b7d"], ["900", "#0c3e66"]] },
  { name: "Cyan (logo cyan)", steps: [["100", "#c9eef7"], ["200", "#97ddef"], ["300", "#5cc8e3"], ["400", "#2ab7d8"], ["500", "#0caacf"], ["600", "#0889aa"], ["700", "#0a6e89"]] },
  { name: "Navy", steps: [["600", "#22587a"], ["700", "#1c4763"], ["800", "#153a52"], ["900", "#0b2e46"], ["950", "#061a28"]] },
  { name: "Tide", steps: [["100", "#e1f0f6"], ["200", "#c9e4ef"], ["300", "#a9d2e3"], ["400", "#7db8d0"], ["700", "#2f6880"], ["800", "#24536a"]] },
  { name: "Mist", steps: [["0", "#ffffff"], ["50", "#f5f8fa"], ["100", "#eaf1f4"], ["200", "#dbe5ea"], ["300", "#c3d0d8"], ["400", "#98a9b4"], ["500", "#6e8291"], ["600", "#4b6273"], ["700", "#3a4e5d"]] },
  { name: "Buoy (status only)", steps: [["300", "#f8c55a"], ["400", "#f5b83d"], ["500", "#e99a16"]] },
];

const colourRules = [
  { title: "Logo blue is the block and the action", body: "Ocean 600 fills brand fields and primary buttons, and carries white text at AA contrast." },
  { title: "Cyan is an accent, never text on light", body: "Logo cyan is for fills, marks and actions on dark fields. On white it reaches only about 2.7:1, too low for text." },
  { title: "Navy is the ink", body: "Navy 900 carries running text on paper and mist, and mist 600 the secondary text. Both pass AA on every light field." },
  { title: "One field per section", body: "A section takes one chapter field, floor to ceiling. Fields change between sections, not inside them." },
  { title: "Status colour means something", body: "Buoy is for flags and warnings inside product screens only, never decoration." },
];

const logoFiles = [
  { href: "/brand/oceanblue-logo.svg", label: "Logo (SVG)" },
  { href: "/brand/oceanblue-logo.png", label: "Logo (PNG)" },
  { href: "/brand/oceanblue-logo-reversed.svg", label: "Logo on dark (SVG)" },
  { href: "/brand/oceanblue-mark.svg", label: "Mark (SVG)" },
];


export default function BrandPage() {
  return (
    <>
      <PageHero
        cells={[{ tone: "bg-field-paper" }, { tone: "bg-tide-200" }, { tone: "bg-cyan-500" }, { tone: "bg-ocean-600" }, { tone: "bg-navy-900" }, { tone: "bg-navy-950" }]}
        lines={["Brand", "guidelines"]}
        standfirst="The logo and colours behind Oceanblue Solutions, Inc. Both blues come from the logo. Paper and navy ink carry the page; logo blue is the block colour and the action."
        side={
          <p>
            Writing about us? The{" "}
            <Link href="/resources/media-kit" className="text-navy-900 underline underline-offset-4">
              media kit
            </Link>{" "}
            has every logo file, approved descriptions and a fact sheet.
          </p>
        }
      />

      <section aria-labelledby="logo-title" className="bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="logo-title" className="display text-head">
              Logo
            </h2>
            <p className="mt-4 max-w-measure-narrow text-mist-600">
              The primary wordmark. Keep clear space around it, and never recolour, stretch or redraw it.
            </p>
            <ul className="mt-6 grid gap-1">
              {logoFiles.map((f) => (
                <li key={f.href}>
                  <a href={f.href} download className="inline-flex min-h-10 items-center gap-2 font-medium text-ocean-700 underline-offset-4 hover:underline">
                    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
                    </svg>
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="axis grid gap-2 sm:grid-cols-2" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            <div className="flex min-h-56 items-center justify-center bg-mist-0 p-10">
              <img src="/brand/oceanblue-logo.svg" alt="Oceanblue Solutions, Inc. logo on a light background" width={202} height={60} className="h-12 w-auto" />
            </div>
            <div className="flex min-h-56 items-center justify-center bg-navy-900 p-10">
              <img src="/brand/oceanblue-logo-reversed.svg" alt="Oceanblue Solutions, Inc. logo on a dark background" width={202} height={60} className="h-12 w-auto" />
            </div>
          </div>
        </div>
      </section>

      {chapterFields.map((f) => (
        <section key={f.token} className={f.cls}>
          <div className="gutter flex min-h-[34svh] flex-wrap items-end justify-between gap-6 py-10">
            <p className="display text-head">{f.name}</p>
            <p className="text-right">
              <span className="block font-medium">
                {f.hex}, bg-{f.token}
              </span>
              <span className="block opacity-80">{f.use}</span>
            </p>
          </div>
        </section>
      ))}

      <section aria-labelledby="rules-title" className="bg-field-mist">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <h2 id="rules-title" className="display side text-head" data-reveal>
            Using colour
          </h2>
          <dl className="axis grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {colourRules.map((r, i) => (
              <div key={r.title} data-reveal style={{ "--d": i % 2 } as React.CSSProperties}>
                <dt className="text-title font-medium">{r.title}</dt>
                <dd className="mt-2 text-mist-700">{r.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="scales-title" className="bg-field-paper">
        <div className="gutter py-24">
          <h2 id="scales-title" className="display text-head">
            Full scales
          </h2>
          <div className="mt-12 grid gap-12">
            {scales.map((s) => (
              <div key={s.name}>
                <p className="font-medium">{s.name}</p>
                <ul className="mt-4 grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-10">
                  {s.steps.map(([step, hex]) => (
                    <li key={step}>
                      <span className="block h-20" style={{ background: hex }} />
                      <span className="mt-2 block text-small">
                        {step} <span className="text-mist-600">{hex}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
