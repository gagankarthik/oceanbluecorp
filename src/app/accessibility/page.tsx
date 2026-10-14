import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/site/LegalPage";
import { company } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/accessibility",
  title: "Accessibility Statement",
  description:
    "Oceanblue Solutions, Inc. is committed to digital accessibility for people with disabilities. Read our WCAG conformance target and how to get help.",
});

const sections: LegalSection[] = [
  {
    id: "commitment",
    title: "Our commitment",
    body: (
      <p>
        We want everyone to be able to use this website, including people with disabilities and people who use assistive technology.
      </p>
    ),
  },
  {
    id: "conformance",
    title: "Conformance status",
    body: (
      <p>
        We aim to conform to the{" "}
        <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener noreferrer" className="text-ocean-700 underline underline-offset-4">
          Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
        </a>
        . These guidelines explain how to make web content more accessible for people with a wide range of disabilities, including visual,
        auditory, motor and cognitive.
      </p>
    ),
  },
  {
    id: "what-we-do",
    title: "What we have done",
    body: (
      <ul className="grid list-disc gap-2 pl-5">
        <li>Text and controls are designed to meet WCAG colour contrast requirements.</li>
        <li>Every page can be used with a keyboard, with a visible focus outline and a link to skip to the main content.</li>
        <li>Images have text alternatives, and decorative images are hidden from screen readers.</li>
        <li>Pages use headings, landmarks and labelled form fields so they make sense to assistive technology.</li>
        <li>Animation is reduced or removed for visitors who ask their device to reduce motion.</li>
        <li>Layouts adapt to phones, tablets and zoomed-in screens.</li>
        <li>The site is designed for current Chrome, Edge, Firefox and Safari and common screen readers, and tested on desktop and mobile.</li>
      </ul>
    ),
  },
  {
    id: "limitations",
    title: "Known limitations",
    body: (
      <p>
        Some third-party content, such as the embedded map on our contact page and documents supplied by others, may not fully meet these
        standards. Our address is always written out in full next to the map. We treat accessibility problems as defects and prioritize
        fixing them, so if you meet a barrier, please tell us.
      </p>
    ),
  },
  {
    id: "feedback",
    title: "Feedback and help",
    body: (
      <p>
        If you have difficulty using any part of this website, or need information in another format, contact us at{" "}
        <a href={`mailto:${company.email}?subject=Accessibility`} className="text-ocean-700 underline underline-offset-4">
          {company.email}
        </a>{" "}
        or call{" "}
        <a href={company.tel} className="text-ocean-700 underline underline-offset-4">
          {company.phone}
        </a>
        . We will respond as soon as we can and work with you to provide what you need.
      </p>
    ),
  },
];

export default function AccessibilityPage() {
  return (
    <LegalPage
      current="/accessibility"
      title="Accessibility"
      updated="October 14, 2026"
      intro={<p>This statement explains how we make this website accessible and how to reach us if something does not work for you.</p>}
      sections={sections}
    />
  );
}
