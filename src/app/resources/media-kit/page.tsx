/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import CopyText from "./CopyText";
import { company, milestones, partners } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  path: "/resources/media-kit",
  title: "Media Kit",
  description:
    "Oceanblue Solutions, Inc. logos, approved company descriptions, a fact sheet and brand colours for press, partners and procurement teams.",
});

const logos = [
  {
    name: "Full logo, colour",
    use: "For light backgrounds. The default version.",
    preview: "/brand/oceanblue-logo.svg",
    dark: false,
    files: [
      { label: "SVG", href: "/brand/oceanblue-logo.svg" },
      { label: "PNG", href: "/brand/oceanblue-logo.png" },
    ],
  },
  {
    name: "Full logo, reversed",
    use: "For dark backgrounds and photographs.",
    preview: "/brand/oceanblue-logo-reversed.svg",
    dark: true,
    files: [
      { label: "SVG", href: "/brand/oceanblue-logo-reversed.svg" },
      { label: "PNG", href: "/brand/oceanblue-logo-reversed.png" },
    ],
  },
  {
    name: "Mark",
    use: "For small spaces, app icons and favicons.",
    preview: "/brand/oceanblue-mark.svg",
    dark: false,
    files: [
      { label: "SVG", href: "/brand/oceanblue-mark.svg" },
      { label: "PNG", href: "/brand/oceanblue-mark-512.png" },
    ],
  },
  {
    name: "Social avatar",
    use: "Profile image for LinkedIn, X, YouTube and Instagram.",
    preview: "/brand/oceanblue-social-avatar.png",
    dark: false,
    files: [{ label: "PNG", href: "/brand/oceanblue-social-avatar.png" }],
  },
];

const shortBio =
  "Oceanblue Solutions is a technology services company headquartered in Powell, Ohio. It provides IT and engineering talent, cloud, cybersecurity, ERP, data and managed services to enterprises and state agencies across North America, as one accountable team.";

const longBio = `Oceanblue Solutions, Inc. is a technology services company founded on ${company.founded} and headquartered in Powell, Ohio, with a delivery center in India and offices in the United Kingdom. The company supplies the people, engineering, platforms and operations an enterprise runs on: IT and engineering staffing, training, cloud engineering, cybersecurity, ERP and Salesforce services, AI and data, digital transformation and managed services. Oceanblue is a minority-owned and women-owned business, certified by the NMSDC, the State of Ohio and the City of Columbus, and is an AWS Advanced Tier Services Partner.`;

const facts = [
  { k: "Legal name", v: company.name },
  { k: "Founded", v: company.founded },
  { k: "Headquarters", v: `${company.address[0]}, ${company.address[1]}` },
  { k: "Delivery", v: "United States, India (since 2022), United Kingdom (since 2024)" },
  { k: "Serves", v: "Enterprises and state government agencies across North America" },
  { k: "Certifications", v: "NMSDC certified MBE, State of Ohio MBE, State of Ohio WBE, City of Columbus MBE" },
  { k: "Technology partners", v: partners.map((p) => (p.name === "AWS" ? "AWS (Advanced Tier Services Partner)" : p.name)).join(", ") },
  { k: "Milestones", v: milestones.map((m) => `${m.year}: ${m.text.replace(/\.$/, "")}`).join(". ") + "." },
];

const colours = [
  { name: "Ocean blue", hex: "#0A72C0", note: "Primary. Logo blue, buttons and blocks", cls: "bg-ocean-600 text-white" },
  { name: "Cyan", hex: "#0CAACF", note: "Accent. Logo cyan", cls: "bg-cyan-500 text-navy-950" },
  { name: "Navy", hex: "#0B2E46", note: "Text and dark backgrounds", cls: "bg-navy-900 text-white" },
  { name: "Mist", hex: "#F5F8FA", note: "Page background", cls: "bg-field-paper text-navy-900" },
];

const guidelines = [
  { ok: true, text: "Leave clear space around the logo so nothing crowds it." },
  { ok: true, text: "Use the colour logo on light backgrounds and the reversed logo on dark ones." },
  { ok: true, text: "Use it large enough that the word Solutions stays readable." },
  { ok: false, text: "Do not recolour, stretch, rotate or add effects to the logo." },
  { ok: false, text: "Do not place the colour logo on busy photographs or mid-tone backgrounds." },
  { ok: false, text: "Do not rebuild the logo or change its wording." },
];

export default function MediaKitPage() {
  return (
    <>
      <PageHero
        cells={[{ tone: "bg-ocean-600" }, { photo: "glassOffice" }, { tone: "bg-cyan-500" }, { photo: "facade" }, { tone: "bg-navy-900" }]}
        lines={["Media kit"]}
        standfirst="Logos, company descriptions, facts and brand colours for press, partners and procurement teams."
        side={
          <p>
            Media enquiries:{" "}
            <a href={`mailto:${company.email}?subject=Media%20enquiry`} className="text-navy-900 underline underline-offset-4">
              {company.email}
            </a>
          </p>
        }
      />

      {/* Logos */}
      <section aria-labelledby="logos-title" className="bg-field-paper">
        <div className="gutter pb-24 md:pb-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="logos-title" className="display text-[clamp(2rem,3.4vw,3rem)] lg:col-span-6" data-reveal>
              Logos
            </h2>
            <p className="max-w-[46ch] text-mist-600 lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal>
              Use SVG wherever you can; it stays sharp at any size. PNG files have transparent backgrounds.
            </p>
          </div>
          <ul className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {logos.map((l, i) => (
              <li key={l.name} className="flex flex-col bg-mist-100" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <div className={`flex h-44 items-center justify-center p-8 ${l.dark ? "bg-navy-900" : "bg-mist-0"}`}>
                  <img src={l.preview} alt={`${l.name} preview`} className="max-h-24 w-auto max-w-full object-contain" loading="lazy" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-semibold">{l.name}</p>
                  <p className="mt-1 flex-1 text-[15px] text-mist-600">{l.use}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {l.files.map((f) => (
                      <a
                        key={f.label}
                        href={f.href}
                        download
                        className="inline-flex min-h-10 items-center gap-2 bg-ocean-600 px-4 text-[15px] font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
                      >
                        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
                        </svg>
                        {f.label}
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Descriptions */}
      <section aria-labelledby="about-title" className="bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <h2 id="about-title" className="display text-[clamp(2rem,3.4vw,3rem)]" data-reveal>
            Company descriptions
          </h2>
          <p className="mt-4 max-w-[60ch] text-mist-600" data-reveal>
            Approved wording for articles, event programs, partner pages and supplier profiles.
          </p>
          <div className="mt-12 grid gap-2 lg:grid-cols-2">
            <div data-reveal>
              <CopyText label="Short description" text={shortBio} />
            </div>
            <div data-reveal style={{ "--d": 1 } as React.CSSProperties}>
              <CopyText label="Long description" text={longBio} />
            </div>
          </div>
        </div>
      </section>

      {/* Fact sheet */}
      <section aria-labelledby="facts-title" className="bg-field-paper">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="facts-title" className="display text-[clamp(2rem,3.4vw,3rem)]">
              Fact sheet
            </h2>
            <p className="mt-4 max-w-[34ch] text-mist-600">The essentials for a profile, a bid or a press release.</p>
          </div>
          <dl className="axis grid gap-2" data-reveal>
            {facts.map((f) => (
              <div key={f.k} className="grid gap-1 bg-mist-100 px-5 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <dt className="font-semibold">{f.k}</dt>
                <dd className="text-navy-900">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Colours and usage */}
      <section aria-labelledby="colours-title" className="bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="colours-title" className="display text-[clamp(2rem,3.4vw,3rem)] lg:col-span-6" data-reveal>
              Brand colours
            </h2>
            <p className="max-w-[46ch] text-mist-600 lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal>
              The two blues come from the logo.{" "}
              <Link href="/brand" className="font-medium text-ocean-700 underline underline-offset-4">
                See the full palette
              </Link>
            </p>
          </div>
          <ul className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {colours.map((c) => (
              <li key={c.hex} className={`flex min-h-44 flex-col justify-between p-6 ${c.cls}`} data-reveal>
                <p className="text-[19px] font-semibold">{c.name}</p>
                <div>
                  <p className="font-medium tabular-nums">{c.hex}</p>
                  <p className="mt-1 text-[14px] opacity-85">{c.note}</p>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="display mt-20 text-[clamp(1.5rem,2.4vw,2.25rem)]" data-reveal>
            Using the logo
          </h3>
          <ul className="mt-8 grid gap-2 md:grid-cols-2">
            {guidelines.map((g) => (
              <li key={g.text} className="flex gap-4 bg-mist-0 p-5" data-reveal>
                <span
                  aria-hidden
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${g.ok ? "bg-ocean-600 text-white" : "bg-mist-200 text-mist-700"}`}
                >
                  <svg viewBox="0 0 12 12" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    {g.ok ? <path d="m2.5 6.2 2.3 2.3 4.7-5" /> : <path d="M3 3l6 6M9 3 3 9" />}
                  </svg>
                </span>
                <span>
                  <span className="sr-only">{g.ok ? "Do: " : "Don't: "}</span>
                  {g.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Closing
        lines={["Writing about", "Oceanblue?"]}
        sentence={`For interviews, quotes or anything not in this kit, write to ${company.email} or call ${company.phone}.`}
        action="Contact us"
      />
    </>
  );
}
