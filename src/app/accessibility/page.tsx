import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Accessibility, Check, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "Ocean Blue Corporation is committed to digital accessibility for people with disabilities. Read our WCAG conformance and how to get help.",
  openGraph: {
    title: "Accessibility Statement | Ocean Blue Corporation",
    description: "Our commitment to an accessible, inclusive experience for everyone.",
    url: "https://oceanbluecorp.com/accessibility",
  },
  alternates: { canonical: "https://oceanbluecorp.com/accessibility" },
};

const MEASURES = [
  "Designed to conform with WCAG 2.1 Level AA success criteria.",
  "Semantic HTML landmarks and a visible “skip to main content” link.",
  "Full keyboard operability with visible focus indicators.",
  "Color contrast checked against WCAG AA thresholds.",
  "Descriptive alternative text on meaningful images.",
  "Accessibility considered in our design and code review process.",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 py-8 first:border-0 first:pt-0">
      <h2 className="hz-display text-[1.4rem] text-[var(--hz-text)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">{children}</div>
    </section>
  );
}

export default function AccessibilityPage() {
  const UPDATED = "May 23, 2026";
  return (
    <div className="horizon min-h-screen bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 85% at 82% 0%, rgba(29,78,216,0.32), transparent 62%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-16 pt-32 sm:px-8">
          <Link href="/" className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[var(--hz-cyan-400)] ring-1 ring-white/15">
              <Accessibility className="h-6 w-6" />
            </span>
            <h1 className="hz-display text-[2.25rem] text-white sm:text-[3rem]">Accessibility</h1>
          </div>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/75">
            We want everyone — including people with disabilities — to be able to use the Ocean Blue Corporation website with confidence.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8">
        <p className="mb-8 text-[13px] text-[var(--hz-text-subtle)]">Last updated: {UPDATED}</p>

        <Section title="Our commitment">
          <p>
            Ocean Blue Corporation is committed to ensuring digital accessibility for people with disabilities. We are
            continually improving the user experience for everyone and applying the relevant accessibility standards so
            that our website is perceivable, operable, understandable, and robust for all users — regardless of ability,
            assistive technology, or device.
          </p>
        </Section>

        <Section title="Conformance status">
          <p>
            We aim to conform to the{" "}
            <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--hz-cobalt)] underline underline-offset-2">
              Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
            </a>
            . These guidelines explain how to make web content more accessible for people with a wide range of
            disabilities, including visual, auditory, motor, and cognitive.
          </p>
        </Section>

        <Section title="What we do">
          <ul className="space-y-2.5">
            {MEASURES.map((m) => (
              <li key={m} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-[var(--hz-text)]">{m}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Compatibility">
          <p>
            Our site is designed to work with current versions of major browsers (Chrome, Edge, Firefox, Safari) and is
            intended to be compatible with common assistive technologies such as screen readers. We test on both desktop
            and mobile devices.
          </p>
        </Section>

        <Section title="Known limitations">
          <p>
            Despite our best efforts, some content may not yet be fully accessible — for example, certain third-party
            embeds or older documents. We treat accessibility issues as defects and prioritize fixing them. If you
            encounter a barrier, please tell us so we can help and improve.
          </p>
        </Section>

        <Section title="Feedback & contact">
          <p>
            We welcome your feedback on the accessibility of this website. If you have difficulty using any part of it,
            or need information in an alternative format, please contact us and we&apos;ll respond as soon as we can:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="mailto:hr@oceanbluecorp.com" className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-[var(--hz-cobalt-100)]">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"><Mail className="h-4 w-4" /></span>
              <span>
                <span className="block text-[12px] text-[var(--hz-text-subtle)]">Email</span>
                <span className="block text-[14px] font-medium text-[var(--hz-text)]">hr@oceanbluecorp.com</span>
              </span>
            </a>
            <a href="tel:+16148446925" className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-[var(--hz-cobalt-100)]">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"><Phone className="h-4 w-4" /></span>
              <span>
                <span className="block text-[12px] text-[var(--hz-text-subtle)]">Phone</span>
                <span className="block text-[14px] font-medium text-[var(--hz-text)]">+1 (614) 844-6925</span>
              </span>
            </a>
          </div>
        </Section>
      </div>
    </div>
  );
}
