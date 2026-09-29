import Image from "next/image";
import { cn } from "@/lib/utils";
import { CONTAINER, SECTION_Y } from "./sections";
import { DotsBackdrop } from "./dots-backdrop";

/* Two kinds of credential at two levels of the page. Technology partners back
   up what we deliver, so they get a full section of their own. Certifications
   are a procurement check, so they sit in a quiet strip near the close.

   `w`/`h` are intrinsic pixels so nothing reflows on decode; `cls` sets the
   rendered height per mark, because the ratios run from 1:1 to 4.2:1. Marks
   keep their own colours: a badge drawn in grey stops reading as the issuer's. */

type Partner = { name: string; tier: string; body: string; src: string; w: number; h: number; cls: string; wordmark?: boolean };

// `body` restates capabilities already claimed on the practice pages.
const PARTNERS: Partner[] = [
  {
    name: "AWS",
    tier: "Advanced Tier Services Partner",
    body: "Cloud migration, security, and the managed infrastructure we run around the clock.",
    src: "/logos/partners/aws-partner-trimmed.png",
    w: 492,
    h: 492,
    cls: "h-12 sm:h-14",
  },
  {
    name: "Snowflake",
    tier: "Partner",
    body: "Warehousing and analytics, the reporting layer the rest of the data work feeds.",
    src: "/logos/partners/snowflake.svg",
    w: 146,
    h: 139,
    cls: "h-9 sm:h-10",
    wordmark: true,
  },
  {
    name: "Databricks",
    tier: "Partner",
    body: "Lakehouse and ML pipelines behind the AI and data intelligence work.",
    src: "/logos/partners/databricks.svg",
    w: 300,
    h: 331,
    cls: "h-9 sm:h-10",
    wordmark: true,
  },
];

/**
 * The partners band on the home page: navy with the dot grid, the argument on
 * the left and the platforms as a divided list on the right. A list, not a
 * card grid, so it does not repeat the shape of the practice cards above it.
 */
export function TechnologyPartnersBand() {
  return (
    <section data-tone="dark" className={cn("on-dark relative isolate overflow-hidden bg-[#050912] text-white", SECTION_Y)} aria-labelledby="partners-heading">
      <DotsBackdrop />
      <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16")}>
        <div className="reveal text-center lg:col-span-5">
          <h2 id="partners-heading" className="type-headline text-white">
            Built on the platforms you already run
          </h2>
          <p className="mx-auto mt-5 max-w-[42ch] type-body-lg text-white/70">
            Our engineers work inside the stack you have. These are the platforms most of our cloud, data and AI delivery is built on.
          </p>
        </div>

        <ul className="reveal divide-y divide-white/10 lg:col-span-6 lg:col-start-7">
          {PARTNERS.map((p) => (
            <li key={p.name} className="grid grid-cols-[minmax(0,7rem)_1fr] items-center gap-6 py-7 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-8 sm:py-8">
              {/* Fixed cell so marks of differing proportions share one left edge and baseline. */}
              <div className="flex h-12 items-center sm:h-14">
                <Image src={p.src} alt="" aria-hidden width={p.w} height={p.h} sizes="64px" className={cn(p.cls, "w-auto max-w-full object-contain")} />
              </div>
              <div>
                <p className="type-title text-white">{p.name}</p>
                <p className="mt-1.5 max-w-[46ch] type-body-sm text-white/70">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type Cert = { name: string; src: string; w: number; h: number; cls: string };

const CERTS: Cert[] = [
  { name: "NMSDC certified Minority Business Enterprise", src: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-12 sm:h-14" },
  { name: "State of Ohio certified Women's Business Enterprise", src: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-8 sm:h-9" },
  { name: "State of Ohio certified Minority Business Enterprise", src: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-8 sm:h-9" },
  { name: "City of Columbus certified Minority Business Enterprise", src: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-10 sm:h-11" },
];

/**
 * Certifications as a quiet trust bar near the close: one line of context,
 * then the four badges in a single row. No cards, captions or dividers; the
 * badges carry the weight. Two by two on phones.
 */
export function CertificationStrip() {
  return (
    <section data-tone="paper" className="bg-paper py-10 sm:py-12" aria-labelledby="certs-heading">
      <div className={cn(CONTAINER, "reveal flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12")}>
        <div className="shrink-0 text-center lg:text-left">
          <p className="type-label text-cobalt">Certifications</p>
          <h2 id="certs-heading" className="mt-1.5 type-title-lg text-ink">
            Certified minority and women owned business
          </h2>
        </div>

        <ul className="grid grid-cols-2 items-center gap-x-6 gap-y-8 sm:flex sm:justify-center sm:gap-12 lg:justify-end">
          {CERTS.map((c) => (
            <li key={c.src} title={c.name} className="flex h-14 items-center justify-center">
              <Image src={c.src} alt={c.name} width={c.w} height={c.h} className={cn(c.cls, "w-auto object-contain")} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
