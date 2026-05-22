import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Mail,
  Phone,
  MapPin,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ============================================================
   CTA — light, framed card (corner plus-marks) holding the
   Ocean Blue "modernise" headline + direct contact details.
   ============================================================ */

export default function CtaSection() {
  return (
    <section className="bg-white px-4 py-20 sm:py-28">
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-y-8 border-y border-border bg-[radial-gradient(35%_80%_at_25%_0%,color-mix(in_oklab,var(--foreground)_8%,transparent),transparent)] px-6 py-14 sm:px-10 sm:py-16">
        {/* Corner plus-marks */}
        <PlusIcon className="absolute top-[-12.5px] left-[-11.5px] z-[1] size-6 text-muted-foreground" strokeWidth={1} />
        <PlusIcon className="absolute top-[-12.5px] right-[-11.5px] z-[1] size-6 text-muted-foreground" strokeWidth={1} />
        <PlusIcon className="absolute bottom-[-12.5px] left-[-11.5px] z-[1] size-6 text-muted-foreground" strokeWidth={1} />
        <PlusIcon className="absolute right-[-11.5px] bottom-[-12.5px] z-[1] size-6 text-muted-foreground" strokeWidth={1} />

        {/* Vertical side rails — extend slightly past the box */}
        <div className="pointer-events-none absolute left-0 -inset-y-6 w-px border-l border-border" />
        <div className="pointer-events-none absolute right-0 -inset-y-6 w-px border-r border-border" />

        {/* Headline + body */}
        <div className="space-y-4 text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to modernise{" "}
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
              what&apos;s next?
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tell us where you&apos;re headed. We&apos;ll bring the people, the
            playbook, and the operating muscle to get you there — one accountable
            partner, one consolidated SLA.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="text-base">
            <Link href="/contact">
              <Calendar className="size-4" />
              Book a discovery call
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/services">Explore services</Link>
          </Button>
        </div>

        {/* Direct contact */}
        <div className="mt-2 border-t border-border pt-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            Get in touch
          </p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Reach the team directly.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a
              href="mailto:info@oceanbluecorp.com"
              className="group flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3 transition-all hover:border-blue-300 hover:shadow-sm"
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Mail className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </p>
                <p className="truncate text-[13.5px] font-semibold text-foreground">
                  info@oceanbluecorp.com
                </p>
              </div>
            </a>

            <a
              href="tel:+16148446925"
              className="group flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3 transition-all hover:border-blue-300 hover:shadow-sm"
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <Phone className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </p>
                <p className="truncate text-[13.5px] font-semibold text-foreground">
                  +1 (614) 844-6925
                </p>
              </div>
            </a>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                <MapPin className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Headquarters
                </p>
                <p className="truncate text-[13.5px] font-semibold text-foreground">
                  Powell, Ohio · USA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
