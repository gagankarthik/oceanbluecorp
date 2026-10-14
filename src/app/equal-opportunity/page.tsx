import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/site/LegalPage";
import { company } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/equal-opportunity",
  title: "Equal Opportunity Employer",
  description:
    "Oceanblue Solutions, Inc. is an equal opportunity employer. Our non-discrimination statement, where it applies, and how to ask for an accommodation during hiring.",
});

const sections: LegalSection[] = [
  {
    id: "statement",
    title: "Our statement",
    body: (
      <p>
        {company.name} is an equal opportunity employer. We make employment decisions, and decisions about the candidates we put forward to
        clients, on the basis of skills, experience and the needs of the role.
      </p>
    ),
  },
  {
    id: "protected",
    title: "No discrimination",
    body: (
      <p>
        We do not discriminate on the basis of race, color, religion, sex, sexual orientation, gender identity, national origin, age,
        disability, genetic information, veteran status, or any other characteristic protected by federal, state or local law.
      </p>
    ),
  },
  {
    id: "scope",
    title: "Where this applies",
    body: (
      <p>
        This applies to every stage of employment, including recruiting, hiring, placement, pay, training, promotion and termination, and to
        both our own staff and the consultants we place with clients.
      </p>
    ),
  },
  {
    id: "accommodations",
    title: "Accommodations",
    body: (
      <p>
        If you need a reasonable accommodation to apply for a role or take part in our hiring process, tell your recruiter at any point and
        we will arrange it, or contact us at{" "}
        <a href={`mailto:${company.email}?subject=Accommodation%20request`} className="text-ocean-700 underline underline-offset-4">
          {company.email}
        </a>
        .
      </p>
    ),
  },
  {
    id: "diversity",
    title: "A diverse business",
    body: (
      <p>
        Oceanblue is itself a minority-owned and women-owned business, certified at national, state and city level.{" "}
        <Link href="/certifications" className="text-ocean-700 underline underline-offset-4">
          See our certifications
        </Link>
        .
      </p>
    ),
  },
];

export default function EqualOpportunityPage() {
  return (
    <LegalPage
      current="/equal-opportunity"
      title="Equal Opportunity Employer"
      updated="October 14, 2026"
      intro={<p>Everyone who applies to Oceanblue, or through Oceanblue, is considered fairly.</p>}
      sections={sections}
    />
  );
}
