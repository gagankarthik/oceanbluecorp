import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, BookOpen, BarChart3, type LucideIcon } from "lucide-react";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Explore Ocean Blue Corporation's resource library — in-depth blog articles, enterprise case studies, and free ebooks on ERP, cloud, AI, IT staffing, and digital transformation.",
  openGraph: {
    title: "Resources | Ocean Blue Corporation",
    description: "Blog, case studies, and ebooks on enterprise IT, ERP, cloud, AI, and staffing.",
    url: "https://oceanbluecorp.com/resources",
  },
  alternates: { canonical: "https://oceanbluecorp.com/resources" },
};

const resourceTypes: { title: string; description: string; icon: LucideIcon; href: string }[] = [
  { title: "Blog", description: "Expert perspectives on enterprise technology, hiring, and delivery — from the people doing the work.", icon: FileText, href: "/resources/blog" },
  { title: "Case Studies", description: "How we've helped organizations modernize systems and strengthen teams, with real outcomes.", icon: BarChart3, href: "/resources/case-studies" },
  { title: "eBooks & Guides", description: "In-depth guides to help you navigate cloud, ERP, security, and staffing decisions.", icon: BookOpen, href: "/resources/ebook" },
];

export default function ResourcesPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[56vh] w-full items-center overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.insightCloud} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, rgba(5,12,28,0.95) 0%, rgba(7,20,43,0.86) 40%, rgba(7,20,43,0.5) 74%, rgba(7,20,43,0.3) 100%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-20 sm:px-8">
          <Eyebrow tone="dark">Resources</Eyebrow>
          <h1 className="hz-display mt-7 max-w-[16ch] text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[4rem]">
            Insights worth your time.
          </h1>
          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
            Perspectives, case studies, and guides to help you make sharper technology and talent decisions.
          </p>
        </div>
      </section>

      {/* Resource types */}
      <section className="relative w-full py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {resourceTypes.map((r) => {
              const Icon = r.icon;
              return (
                <Link key={r.title} href={r.href} className="hz-card group flex h-full flex-col p-8">
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.04] text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[var(--hz-cobalt)] group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  </div>
                  <h2 className="hz-display mt-6 text-[1.5rem] text-[var(--hz-text)]">{r.title}</h2>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">{r.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-7 text-[14px] font-semibold text-[var(--hz-cobalt)]">
                    Explore {r.title}
                    <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.75} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <Photo src={IMG.cta} className="z-0" fallback="linear-gradient(135deg, #0e2147 0%, #07142b 100%)" />
        <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(5,12,28,0.9) 0%, rgba(7,20,43,0.84) 100%), radial-gradient(60% 80% at 50% 0%, rgba(29,78,216,0.4), transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 sm:py-32">
          <Eyebrow tone="dark">Let&apos;s talk</Eyebrow>
          <h2 className="hz-display mt-7 max-w-[18ch] text-[2.25rem] text-white sm:text-[3rem]">
            Have a project that needs the right team?
          </h2>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Cta href="/contact" variant="primary" icon={ArrowRight}>Start a conversation</Cta>
            <Cta href="/services" variant="ghostDark">Explore services</Cta>
          </div>
        </div>
      </section>
    </div>
  );
}
