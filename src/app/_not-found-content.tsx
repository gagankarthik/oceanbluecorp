import Link from "next/link";
import { CONTAINER } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { LineGrid } from "@/components/site/line-grid";
import { MissingPage } from "@/components/site/missing-page";
import { IconArrowRight, IconLayers, IconBriefcase, IconBuilding, IconMail, type Icon } from "@/components/site/icons";

/* The illustration carries the 404; the copy says what happened and gives the
   likeliest ways out, then the rest of the site as real destinations. */

const destinations: { title: string; href: string; desc: string; icon: Icon }[] = [
  { title: "Solutions", href: "/solutions", desc: "Staffing, engineering, platforms and operations", icon: IconLayers },
  { title: "Careers", href: "/careers", desc: "What the work is like, and how we hire", icon: IconBriefcase },
  { title: "About", href: "/about", desc: "Who we are and how we work", icon: IconBuilding },
  { title: "Contact", href: "/contact", desc: "Talk to a person", icon: IconMail },
];

export default function NotFoundContent() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      <LineGrid />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_30%,var(--color-cobalt-tint),transparent)]" />

      <div className={`${CONTAINER} pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pb-24`}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
          <MissingPage id="nf" className="rise mx-auto h-auto w-full max-w-[420px] lg:order-2 lg:max-w-none" />

          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 font-mono text-[13px] font-medium text-cobalt" style={{ animationDelay: "200ms" }}>
              <span className="size-1.5 rounded-full bg-cobalt" aria-hidden />
              Error 404
            </p>
            <h1 className="rise mt-4 type-headline-lg font-semibold text-ink" style={{ animationDelay: "280ms" }}>
              This page doesn&rsquo;t exist.
            </h1>
            <p className="rise mt-5 max-w-[50ch] type-body-lg text-ink-muted" style={{ animationDelay: "360ms" }}>
              The page you&rsquo;re looking for isn&rsquo;t here. The address may be mistyped,
              or the page may have moved. Nothing is broken on your end.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ animationDelay: "440ms" }}>
              <LinkButton href="/" variant="primary" size="lg">
                Back to home <IconArrowRight size={16} />
              </LinkButton>
              <LinkButton href="/contact" variant="outline" size="lg">
                Contact us
              </LinkButton>
          </div>
          </div>
        </div>

        <div className="rise mx-auto mt-16 max-w-[1040px]" style={{ animationDelay: "520ms" }}>
          <p className="text-center type-label font-semibold text-ink">Or head somewhere useful</p>
          <ul className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="mt-6 text-center type-body-sm text-ink-muted">
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
