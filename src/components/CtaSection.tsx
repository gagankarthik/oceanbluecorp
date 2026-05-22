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
      </div>
    </section>
  );
}
