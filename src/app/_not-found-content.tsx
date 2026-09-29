import Link from "next/link";
import { CONTAINER } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight, IconLayers, IconBriefcase, IconBuilding, IconMail, type Icon } from "@/components/site/icons";

/* Calm, not clever: say what happened, give the two likeliest ways out, then
   the rest of the site as real destinations. Entrance is CSS (.rise), so it
   paints on first byte and holds still under reduced motion. */

const destinations: { title: string; href: string; desc: string; icon: Icon }[] = [
  { title: "Solutions", href: "/solutions", desc: "Staffing, engineering, platforms and operations", icon: IconLayers },
  { title: "Careers", href: "/careers", desc: "What the work is like, and how we hire", icon: IconBriefcase },
  { title: "About", href: "/about", desc: "Who we are and how we work", icon: IconBuilding },
  { title: "Contact", href: "/contact", desc: "Talk to a person", icon: IconMail },
];

export default function NotFoundContent() {
  return (
    <section className="bg-white">
      <div className={`${CONTAINER} grid min-h-[70svh] gap-12 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16`}>
        <div>
          <h1 className="sr-only">404, page not found</h1>
          <p aria-hidden className="rise font-mono text-[15px] font-medium text-cobalt">
            Error 404
          </p>
          <p className="rise mt-3 max-w-[16ch] type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
            This page does not exist.
          </p>
          <p className="rise mt-6 max-w-[46ch] type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
            The address may be mistyped, or the page may have moved since you last
            saw it. Nothing is broken on your end.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
            <LinkButton href="/" variant="primary" size="lg">
              Back to home <IconArrowRight size={16} />
            </LinkButton>
            <LinkButton href="/contact" variant="outline" size="lg">
              Contact us
            </LinkButton>
          </div>
        </div>

        <div className="rise" style={{ animationDelay: "320ms" }}>
          <p className="type-label font-semibold text-ink">Or try one of these</p>
          <ul className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {destinations.map((d) => (
              <li key={d.href} className="bg-white">
                <Link href={d.href} className="group flex h-full flex-col p-6 transition-colors hover:bg-paper">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-line text-ink transition-colors group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white">
                    <d.icon size={18} />
                  </span>
                  <span className="mt-4 flex items-center gap-1.5 text-[16px] font-semibold text-ink">
                    {d.title}
                    <IconArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 type-body-sm text-ink-subtle">{d.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 type-body-sm text-ink-muted">
            Looking for a role?{" "}
            <Link href="/careers/search" className="font-semibold text-ink underline underline-offset-4 hover:text-cobalt">
              Search open positions
            </Link>
            . For everything else, the{" "}
            <Link href="/sitemap" className="font-semibold text-ink underline underline-offset-4 hover:text-cobalt">
              site map
            </Link>{" "}
            lists every page.
          </p>
        </div>
      </div>
    </section>
  );
}
