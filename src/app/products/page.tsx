/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import Photo from "@/components/site/Photo";
import BlueIQDemo from "@/components/visuals/BlueIQDemo";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/products",
  title: "Products: Blue-IQ and Inytes",
  description:
    "Blue-IQ turns documents into confidence-scored structured data; Inytes designs, sends and tracks event invitations. Both built and run by Oceanblue Solutions.",
});

const flow = [
  { name: "Reads", body: "Documents of every kind: PDFs, Word files, scans and photos taken on a phone." },
  { name: "Extracts", body: "Each field comes back as structured data, with a confidence score attached." },
  { name: "Flags", body: "Anything it is unsure of goes to a person, so people only review what needs judgement." },
];

const blueIqFacts = [
  { k: "What it does", v: "Turns documents into structured, scored data" },
  { k: "Built for", v: "Education, workforce, legal, finance and healthcare teams" },
  { k: "Reads", v: "PDF, DOCX, scans and phone photos" },
];

const blueIqModules = [
  { name: "Sonar", body: "The engine underneath, confidence-scored on every field." },
  { name: "Capture", body: "Any document into structured data." },
  { name: "Spend", body: "Reconciles invoices and entitlements." },
  { name: "Govern", body: "Surfaces contract and compliance risk." },
];

const inytesFacts = [
  { k: "What it does", v: "Designs, sends and tracks event invitations" },
  { k: "Built for", v: "Weddings, birthdays, baby showers, housewarmings and festivals" },
  { k: "Sends over", v: "WhatsApp, SMS and social" },
];

const inytesFeatures = ["Event-specific design templates", "RSVP and guest tracking", "Sharing over WhatsApp, SMS and social", "Video and AI-generated invitations"];


function Facts({ items, tone = "light" }: { items: { k: string; v: string }[]; tone?: "light" | "mist" }) {
  return (
    <dl className="grid gap-2">
      {items.map((f) => (
        <div key={f.k} className={`grid gap-1 px-5 py-4 ${tone === "mist" ? "bg-mist-100" : "bg-mist-0"}`}>
          <dt className="text-[15px] font-semibold text-mist-600">{f.k}</dt>
          <dd className="text-navy-900">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

function VisitLink({ href, label, className }: { href: string; label: string; className: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-12 items-center gap-2 px-6 font-medium transition-colors active:scale-[0.98] ${className}`}>
      {label}
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 3h7v7M13 3 4 12" />
      </svg>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export default function ProductsPage() {
  return (
    <>
      <PageHero
        cells={[{ photo: "lattice" }, { tone: "bg-navy-900" }, { photo: "concrete" }, { tone: "bg-ocean-600" }]}
        lines={["Our products"]}
        standfirst="Same people and same standards as our client work. Running our own products in production keeps us honest about what software needs after it ships."
        side={
          <p>
            Two products: <a href="#blue-iq" className="text-navy-900 underline underline-offset-4">Blue-IQ</a> for documents,{" "}
            <a href="#inytes" className="text-navy-900 underline underline-offset-4">Inytes</a> for invitations.
          </p>
        }
      />

      <section id="blue-iq" aria-labelledby="blue-iq-title" className="scroll-mt-24 bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <img src="/logos/products/blue-iq.svg" alt="Blue-IQ" width={283} height={74} className="h-auto w-full max-w-[15rem]" />
            <div className="mt-10">
              <Facts items={blueIqFacts} tone="mist" />
            </div>
          </div>
          <div className="axis" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            <h2 id="blue-iq-title" className="sr-only">
              Blue-IQ, document intelligence
            </h2>
            <p className="max-w-[40ch] text-[clamp(1.375rem,2vw,1.875rem)] leading-[1.3] [text-indent:3em]">
              Blue-IQ turns documents into structured data. Every field comes back with a confidence score, and it flags what it is unsure
              of instead of guessing.
            </p>
            <ol className="mt-14 grid gap-10 sm:grid-cols-3">
              {flow.map((f) => (
                <li key={f.name}>
                  <p className="text-[20px] font-medium">{f.name}</p>
                  <p className="mt-2">{f.body}</p>
                </li>
              ))}
            </ol>
            <h3 className="mt-16 text-[20px] font-medium">What is in it</h3>
            <dl className="mt-6 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {blueIqModules.map((m) => (
                <div key={m.name} className="border-t border-mist-300 pt-4">
                  <dt className="font-semibold">{m.name}</dt>
                  <dd className="mt-1 text-mist-600">{m.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="demo-title" className="bg-navy-950 text-mist-50">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="demo-title" className="display side text-[clamp(2.25rem,4vw,3.75rem)]" data-reveal>
              See how Blue-IQ works
            </h2>
            <p className="axis max-w-[44ch] self-end text-tide-300" data-reveal>
              Point at a field to see where it came from on the scan. Switch on &ldquo;needs review only&rdquo; to see what a person would check.
            </p>
          </div>
          <div className="mt-14" data-reveal>
            <BlueIQDemo />
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center bg-cyan-500 px-6 font-medium text-navy-950 transition-colors hover:bg-cyan-300 active:scale-[0.98]"
            >
              Ask for a Blue-IQ demo
            </Link>
            <VisitLink href="https://www.blue-iq.ai/" label="Visit Blue-IQ" className="bg-white/10 text-white hover:bg-white/20" />
          </div>
        </div>
      </section>

      <section id="inytes" aria-labelledby="inytes-title" className="scroll-mt-24 bg-field-paper">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <Photo name="fireworks" className="aspect-[4/5]" />
          </div>
          <div className="axis" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            <img src="https://cdn.inytes.com/images/brand/inytes-logo.png" alt="Inytes logo" className="h-12 w-auto" loading="lazy" />
            <h2 id="inytes-title" className="poster mt-8 text-poster">
              Inytes
            </h2>
            <p className="mt-8 max-w-[40ch] text-[clamp(1.25rem,1.6vw,1.5rem)] leading-snug">
              Digital invitations for weddings, birthdays, baby showers, housewarmings and festivals, built for the Indian celebration market. Built, hosted and supported by the same team that runs client systems.
            </p>
            <div className="mt-12 grid gap-10 xl:grid-cols-2">
              <Facts items={inytesFacts} tone="mist" />
              <ul className="grid content-start gap-3">
                {inytesFeatures.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ocean-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <VisitLink href="https://www.inytes.com/" label="Visit Inytes" className="mt-12 bg-ocean-600 text-white hover:bg-ocean-700" />
          </div>
        </div>
      </section>

      <Closing lines={["Request a", "Blue-IQ demo"]} action="Ask for a demo" />
    </>
  );
}
