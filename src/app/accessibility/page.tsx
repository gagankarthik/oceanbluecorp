import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { DocPage, DocSection, IconPhone, RelatedLinks } from "@/components/site/legal/doc";
import { IconCheck, IconMail } from "@/components/site/icons";

export const metadata: Metadata = pageMetadata({
  path: "/accessibility",
  title: "Accessibility Statement",
  description: "Oceanblue Solutions, Inc. is committed to digital accessibility for people with disabilities. Read our WCAG conformance and how to get help.",
});

const MEASURES = [
  "Designed to conform with WCAG 2.1 Level AA success criteria.",
  "Semantic HTML landmarks and a visible “skip to main content” link.",
  "Full keyboard operability with visible focus indicators.",
  "Color contrast checked against WCAG AA thresholds.",
  "Descriptive alternative text on meaningful images.",
  "Accessibility considered in our design and code review process.",
];

const SECTIONS = [
  { id: "commitment", label: "Our commitment" },
  { id: "conformance", label: "Conformance status" },
  { id: "measures", label: "What we do" },
  { id: "compatibility", label: "Compatibility" },
  { id: "limitations", label: "Known limitations" },
  { id: "feedback", label: "Feedback & contact" },
];

function Channel({ href, label, value, icon }: { href: string; label: string; value: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="plain group flex min-h-16 items-center gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-cobalt">{icon}</span>
      <span>
        <span className="block type-caption text-ink-subtle">{label}</span>
        <span className="block type-body font-medium text-ink">{value}</span>
      </span>
    </a>
  );
}

export default function AccessibilityPage() {
  const UPDATED = "May 23, 2026";
  return (
    <DocPage
      title="Accessibility"
      lede="We want everyone, including people with disabilities, to be able to use the Oceanblue Solutions, Inc. website with confidence."
      meta={[{ label: "Last updated", value: UPDATED }]}
      toc={SECTIONS}
    >
      <DocSection id="commitment" title="Our commitment">
        <p>
          Oceanblue Solutions, Inc. is committed to ensuring digital accessibility for people with disabilities. We are
          continually improving the user experience for everyone and applying the relevant accessibility standards so
          that our website is perceivable, operable, understandable, and robust for all users, regardless of ability,
          assistive technology, or device.
        </p>
      </DocSection>

      <DocSection id="conformance" title="Conformance status">
        <p>
          We aim to conform to the{" "}
          <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener noreferrer">
            Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
          </a>
          . These guidelines explain how to make web content more accessible for people with a wide range of
          disabilities, including visual, auditory, motor, and cognitive.
        </p>
      </DocSection>

      <DocSection id="measures" title="What we do">
        {/* A checklist in a hairline grid: these are separate commitments, each one checkable. */}
        <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {MEASURES.map((m) => (
            <li key={m} className="flex items-start gap-3 bg-white p-4">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cobalt-tint text-cobalt">
                <IconCheck size={14} />
              </span>
              <span className="type-body text-ink">{m}</span>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="compatibility" title="Compatibility">
        <p>
          Our site is designed to work with current versions of major browsers (Chrome, Edge, Firefox, Safari) and is
          intended to be compatible with common assistive technologies such as screen readers. We test on both desktop
          and mobile devices.
        </p>
      </DocSection>

      <DocSection id="limitations" title="Known limitations">
        <p>
          Despite our best efforts, some content may not yet be fully accessible, for example, certain third-party
          embeds or older documents. We treat accessibility issues as defects and prioritize fixing them. If you
          encounter a barrier, please tell us so we can help and improve.
        </p>
      </DocSection>

      <DocSection id="feedback" title="Feedback & contact">
        <p>
          We welcome your feedback on the accessibility of this website. If you have difficulty using any part of it,
          or need information in an alternative format, please contact us and we&apos;ll respond as soon as we can:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Channel href="mailto:hr@oceanbluecorp.com" label="Email" value="hr@oceanbluecorp.com" icon={<IconMail size={18} />} />
          <Channel href="tel:+16148446925" label="Phone" value="+1 (614) 844-6925" icon={<IconPhone size={18} />} />
        </div>
      </DocSection>

      <RelatedLinks links={[{ href: "/legal", label: "All legal documents" }, { href: "/contact", label: "Contact Us" }]} />
    </DocPage>
  );
}
