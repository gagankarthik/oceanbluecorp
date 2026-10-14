// Public-side job rules: when pay is shown, and the schema.org JobPosting. Pure.

import type { Job } from "@/lib/aws/dynamodb";
import { workMode } from "@/lib/careers";
import { richTextToPlain } from "@/lib/rich-text";
import { currencyCode, salaryUnitText } from "@/lib/salary";
import { SITE_URL } from "@/lib/seo";

type Salary = NonNullable<Job["salary"]>;

/** The salary a job seeker may see: only when the posting opts in with `showPay`. */
export function salaryIfShown(job: { salary?: Job["salary"] | null; showPay?: boolean }): Salary | undefined {
  return job.showPay === true && job.salary ? job.salary : undefined;
}

// Google's employmentType vocabulary, not ours.
const EMPLOYMENT_TYPE: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  "contract-to-hire": "CONTRACTOR",
  "direct-hire": "FULL_TIME",
  "managed-teams": "CONTRACTOR",
  remote: "FULL_TIME",
};

/** schema.org MonetaryAmount, or undefined when there is no positive figure. */
export function baseSalaryLd(s: Salary | null | undefined) {
  if (!s) return undefined;
  const min = Number.isFinite(s.min) && s.min > 0 ? s.min : undefined;
  const max = Number.isFinite(s.max) && s.max > 0 ? s.max : undefined;
  if (min === undefined && max === undefined) return undefined;
  const range = min !== undefined && max !== undefined && min !== max
    ? { minValue: Math.min(min, max), maxValue: Math.max(min, max) }
    : { value: (min ?? max)! };
  return {
    "@type": "MonetaryAmount",
    currency: currencyCode(s.currency),
    value: { "@type": "QuantitativeValue", ...range, unitText: salaryUnitText(s) },
  };
}

export type JobPostingSource = Pick<
  Job,
  | "id" | "postingId" | "title" | "description" | "requirements" | "responsibilities" | "type"
  | "workplace" | "location" | "state" | "department" | "submissionDueDate" | "createdAt" | "skills"
> & { salary?: Job["salary"] | null; showPay?: boolean };

/**
 * JobPosting structured data; without it a role cannot appear in Google Jobs.
 * Takes a CandidateJob or a record: `baseSalary` only when `showPay` is true.
 */
export function jobPostingJsonLd(job: JobPostingSource, publishedAt?: string) {
  const remote = workMode(job) === "Remote";
  const responsibilities = richTextToPlain(job.responsibilities);
  const qualifications = richTextToPlain(job.requirements);
  const baseSalary = baseSalaryLd(salaryIfShown(job));
  const skills = (job.skills ?? []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: { "@type": "PropertyValue", name: "Oceanblue Solutions, Inc.", value: job.postingId || job.id },
    datePosted: publishedAt ?? job.createdAt,
    ...(job.submissionDueDate ? { validThrough: `${job.submissionDueDate.slice(0, 10)}T23:59:59` } : {}),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: "Oceanblue Solutions, Inc.",
      sameAs: SITE_URL,
      logo: `${SITE_URL}/brand/oceanblue-mark-512.png`,
    },
    ...(job.department ? { industry: job.department } : {}),
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "US" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(job.location ? { addressLocality: job.location.replace(/\([^)]*\)/g, "").trim() } : {}),
              ...(job.state ? { addressRegion: job.state } : {}),
              addressCountry: "US",
            },
          },
        }),
    ...(responsibilities ? { responsibilities } : {}),
    ...(qualifications ? { qualifications } : {}),
    ...(skills.length ? { skills } : {}),
    ...(baseSalary ? { baseSalary } : {}),
    directApply: true,
    url: `${SITE_URL}/jobs/${job.id}`,
  };
}
