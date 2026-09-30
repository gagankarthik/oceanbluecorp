import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/components/landing/media";
import { cn } from "@/lib/utils";
import { LinkButton } from "./button";
import { DotsBackdrop } from "./dots-backdrop";
import { IconArrowRight, IconClock, IconMail, IconPhone } from "./icons";
import { LineGrid } from "./line-grid";
import { CloudShader } from "@/components/ui/cloud-shader";

/* The building blocks every public page is composed from. One container
   width, one section rhythm, one heading scale, so pages differ in content
   and never in chrome. */

export const CONTAINER = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";

/* The site's vertical rhythm. Every section, opener and gap draws from these,
   so spacing is decided once instead of per page.

   SECTION_Y  sits on the <section> itself (not an inner div), so the
              same-tone collapse rule in globals.css can remove the top half
              when two borderless sections of one colour meet.
   OPENER_Y   first block under the fixed header (64px, 68px from md).
              Openers carry data-opener; whatever section follows gets one
              fixed top (globals.css), so the gap across the opener's hairline
              is the same on every page.
   STACK_*    gaps inside a section: title to content, content to its link. */
export const SECTION_Y = "py-16 sm:py-20 lg:py-24";
export const OPENER_Y = "pt-28 pb-10 sm:pt-32 sm:pb-12 lg:pt-36 lg:pb-14";
export const STACK_LG = "mt-10 sm:mt-12";
export const STACK_MD = "mt-8 sm:mt-10";

/** Section header: optional kicker, title, supporting line and one "Explore" link.
 *  Left-aligned on light grounds, centred on dark ones. */
export function SectionTitle({
  title,
  sub,
  kicker,
  link,
  className,
  dark,
  align = dark ? "center" : "left",
}: {
  title: string;
  sub?: string;
  kicker?: string;
  link?: { href: string; label: string };
  className?: string;
  dark?: boolean;
  align?: "left" | "center";
}) {
  const center = align === "center";
  return (
    <div className={cn(center ? "mx-auto max-w-[820px] text-center" : "max-w-[760px]", className)}>
      {kicker && <p className={cn("reveal type-label", dark ? "text-cobalt-light" : "text-cobalt")}>{kicker}</p>}
      <h2 className={cn("reveal type-headline", kicker && "mt-3", dark ? "text-white" : "text-ink")}>{title}</h2>
      {sub && <p className={cn("reveal mt-5 max-w-[640px] type-body-lg", center && "mx-auto", dark ? "text-white/75" : "text-ink-muted")}>{sub}</p>}
      {link && (
        <SectionLink href={link.href} dark={dark} className="reveal mt-6">
          {link.label}
        </SectionLink>
      )}
    </div>
  );
}

/** The "Explore ▸" text link a section header ends on. */
export function SectionLink({ href, children, className, dark }: { href: string; children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-[15px] font-semibold transition-colors",
        dark ? "text-white hover:text-cobalt-light" : "text-ink hover:text-cobalt",
        className,
      )}
    >
      {children}
      <svg aria-hidden viewBox="0 0 8 10" className="size-2 fill-current transition-transform group-hover:translate-x-0.5">
        <path d="M0 0l8 5-8 5z" />
      </svg>
    </Link>
  );
}

type Ground = "white" | "paper";
const GROUND: Record<Ground | "none", string> = { white: "#fff", paper: "var(--color-paper)", none: "transparent" };

/** Wraps a dark band so its cut corners show the section above (`ground`) at
 *  the top and the section below (`below`, default the same) at the bottom.
 *  `below="none"` leaves the bottom corners clear for a section tucked under
 *  the band (ClosingCta `tuck`). */
export function ChamferGround({ ground = "white", below, children }: { ground?: Ground; below?: Ground | "none"; children: React.ReactNode }) {
  return (
    <div className="relative z-10" style={{ background: `linear-gradient(to bottom, ${GROUND[ground]} 50%, ${GROUND[below ?? ground]} 50%)` }}>
      {children}
    </div>
  );
}

/** Every section: same padding, header, then content. Dark and blue tones get chamfered corners. */
export function Section({
  tone = "white",
  title,
  sub,
  kicker,
  link,
  children,
  id,
  ground,
  below,
}: {
  /** `dark` is navy with the dot grid, `blue` cobalt with diagonal stripes: at most one of either per page (60-30-10). */
  tone?: "white" | "paper" | "dark" | "blue";
  title: string;
  sub?: string;
  kicker?: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
  id?: string;
  /** Dark tones only: the tone of the neighbouring sections, shown in the cut corners. */
  ground?: Ground;
  /** Dark tones only: the tone of the section after, if it differs from `ground`. */
  below?: Ground | "none";
}) {
  const dark = tone === "dark" || tone === "blue";
  const section = (
    <section
      id={id}
      data-tone={tone}
      className={cn(
        tone === "paper" ? "bg-paper" : tone === "blue" ? "on-dark chamfer relative isolate overflow-hidden bg-cobalt text-white" : dark ? "on-dark chamfer relative isolate overflow-hidden bg-night text-white" : "bg-white",
        SECTION_Y,
        id && "scroll-mt-28",
      )}
    >
      {tone === "dark" && <DotsBackdrop />}
      {tone === "blue" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(115deg,rgb(255_255_255/0.09)_0_1px,transparent_1px_72px)]" />
      )}
      <div className={CONTAINER}>
        <SectionTitle title={title} sub={sub} kicker={kicker} link={link} dark={dark} />
        <div className={cn("reveal", STACK_LG)}>{children}</div>
      </div>
    </section>
  );
  return dark ? <ChamferGround ground={ground} below={below}>{section}</ChamferGround> : section;
}

/** Sub-page opening: breadcrumb-free, left-aligned, one sentence of purpose. */
export function PageIntro({
  kicker,
  title,
  sub,
  children,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <section data-opener className="relative isolate overflow-hidden border-b border-line bg-white">
      <LineGrid />
      <div className={cn(CONTAINER, OPENER_Y)}>
        {kicker && <p className="rise text-[14px] font-semibold text-cobalt">{kicker}</p>}
        <h1 className="rise mt-3 max-w-[900px] type-headline-lg text-ink" style={{ animationDelay: "80ms" }}>
          {title}
        </h1>
        {sub && (
          <p className="rise mt-6 max-w-[640px] type-body-lg text-ink-muted" style={{ animationDelay: "180ms" }}>
            {sub}
          </p>
        )}
        {children && <div className="rise mt-9" style={{ animationDelay: "280ms" }}>{children}</div>}
      </div>
    </section>
  );
}

/** Direct routes, as printed on /contact. Change them there and here together. */
const DIRECT = [
  { icon: IconPhone, label: "Call", value: "+1 (614) 844-6925", href: "tel:+16148446925" },
  { icon: IconMail, label: "Email", value: "hr@oceanbluecorp.com", href: "mailto:hr@oceanbluecorp.com" },
  { icon: IconClock, label: "Hours", value: "Mon–Fri, 8:00 AM–5:00 PM EST" },
];

/** The close on every page: the Columbus skyline fills the section, and the
 *  copy sits in its sky. An eased mask dissolves the tower tops into the page
 *  before they reach the text. */
export function ClosingCta({
  title = "Tell us what you need filled, built or kept running",
  sub = "Bring a role, a system or a deadline. We will come back with a plan and the people to deliver it.",
  primary = { href: "/contact", label: "Talk to us" },
  secondary = { href: "/careers/search", label: "Find a job" },
  tuck,
}: {
  title?: string;
  sub?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  /** Directly after a dark band (with `below="none"`): slide up under its cut
   *  bottom corners so the sky fills them, with no fade at the top. */
  tuck?: boolean;
}) {
  return (
    <section
      data-tone="white"
      data-ground="own"
      className={cn("relative isolate overflow-hidden bg-[linear-gradient(to_bottom,#fff_70%,#f3f6fb_100%)]", tuck && "-mt-5 lg:-mt-12")}
      aria-labelledby="cta-heading"
    >
      {/* Downtown Columbus, a few miles from the Powell office. The crop is locked
          to the photo's proportions: it opens just above the tower tops and ends on
          the bridge, which dissolves into the footer's paper (the section's own
          background eases to the same colour), so there is no seam at any width. */}
      {/* Drifting clouds across the top of the section, the sky over the
          skyline; a thin fade at the top edge, out into the photo's sky below. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -z-20 h-[80%]",
          tuck
            ? "[mask-image:linear-gradient(to_bottom,black_62%,transparent_95%)]"
            : "[mask-image:linear-gradient(to_bottom,transparent,black_6%,black_62%,transparent_95%)]",
        )}
      >
        <CloudShader className="min-h-0" count={6} speed={0.8} skyTopColor="#9fc0ec" skyBottomColor="#dfeaf8" cloudColor="#ffffff" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 aspect-[700/290] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.04)_6%,rgb(0_0_0/0.14)_12%,rgb(0_0_0/0.3)_18%,rgb(0_0_0/0.5)_24%,rgb(0_0_0/0.7)_30%,rgb(0_0_0/0.86)_36%,#000_44%,#000_76%,rgb(0_0_0/0.8)_83%,rgb(0_0_0/0.5)_90%,rgb(0_0_0/0.18)_96%,transparent_100%)]">
        <Image src={IMG.ctaColumbus} alt="" width={2400} height={1601} sizes="100vw" className="absolute inset-x-0 top-[-19.3%] h-auto w-full max-w-none" />
      </div>
      <div className={cn(CONTAINER, "grid gap-10 pt-16 pb-[max(10rem,33vw)] sm:pt-20 lg:grid-cols-12 lg:items-end lg:gap-12 lg:pt-24")}>
        <div className="reveal lg:col-span-7">
          <h2 id="cta-heading" className="max-w-[640px] type-headline-lg text-balance text-ink">
            {title}
          </h2>
          <p className="mt-5 max-w-[540px] type-body-lg text-ink-muted">{sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={primary.href} variant="primary" size="lg">
              {primary.label}
              <IconArrowRight size={16} />
            </LinkButton>
            <LinkButton href={secondary.href} variant="outline" size="lg">
              {secondary.label}
            </LinkButton>
          </div>
        </div>

        <div className="reveal lg:col-span-5">
          <p className="type-label text-ink">Prefer to talk to a person?</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {DIRECT.map((d) => {
              const body = (
                <>
                  <d.icon size={18} className="shrink-0 text-cobalt" />
                  <span className="w-16 shrink-0 type-body-sm text-ink-subtle">{d.label}</span>
                  <span className="min-w-0 type-body font-medium break-words text-ink">{d.value}</span>
                  {d.href && <IconArrowRight size={15} className="ml-auto shrink-0 text-ink-subtle transition-transform group-hover:translate-x-1 group-hover:text-cobalt" />}
                </>
              );
              return (
                <li key={d.label}>
                  {d.href ? (
                    <a href={d.href} className="group flex items-center gap-3.5 py-3.5">
                      {body}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3.5 py-3.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </section>
  );
}

/** A plain padded band for sub-page content. `muted` puts it on paper. */
export function Band({ children, className, muted, id }: { children: React.ReactNode; className?: string; muted?: boolean; id?: string }) {
  return (
    <section id={id} data-tone={muted ? "paper" : "white"} className={cn(muted ? "bg-paper" : "bg-white", SECTION_Y, id && "scroll-mt-28")}>
      <div className={cn(CONTAINER, className)}>{children}</div>
    </section>
  );
}

/** Opener for documents: legal, policies, statements. Paper ground, aligned to PolicyBody's prose column. */
export function DocHero({ title, lede, updated }: { title: string; lede?: string; updated?: string }) {
  return (
    <section data-opener className="relative isolate overflow-hidden border-b border-line bg-paper">
      <LineGrid />
      <div className={cn(CONTAINER, OPENER_Y, "lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12")}>
        <div className="hidden lg:block" />
        <div className="max-w-[760px]">
          <h1 className="rise type-headline-lg text-ink">{title}</h1>
          {lede && (
            <p className="rise mt-4 type-body-lg text-ink-muted" style={{ animationDelay: "100ms" }}>
              {lede}
            </p>
          )}
          {updated && (
            <p className="rise mt-6 text-[14px] text-ink-subtle" style={{ animationDelay: "180ms" }}>
              Last updated {updated}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Long-form reading layout: sticky contents on the left, prose on the right. */
export function PolicyBody({ sections }: { sections: { id: string; h: string; body: React.ReactNode }[] }) {
  return (
    <div className={cn(CONTAINER, SECTION_Y, "grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]")}>
      <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-[13.5px] font-semibold text-ink">On this page</p>
        <ul className="mt-3 space-y-2 border-l border-line">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-[14px] text-ink-muted hover:border-ink hover:text-ink">
                {s.h}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="max-w-[760px] space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="type-headline-sm text-ink">{s.h}</h2>
            <div className="mt-4 space-y-4 type-body text-ink-muted [&_a]:font-medium [&_a]:text-cobalt [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-ink [&_ul]:space-y-2">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
