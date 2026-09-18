import { Metadata } from "next";
import { OG_IMAGES } from "@/lib/seo";
import { notFound } from "next/navigation";
import { toPublicJob, type PublicJob } from "@/lib/aws/dynamodb";
import { richTextToPlain } from "@/lib/rich-text";
import JobDetailsClient from "./JobDetailsClient";
import { loadJob } from "./job";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Serialize JSON-LD for embedding in a <script> tag.
 *
 * JSON.stringify escapes quotes but NOT `<`, so a job description containing
 * "</script>" would close the tag early and let the remainder be parsed as
 * markup, stored XSS via the admin job editor. Escaping `<` (and the JS line
 * terminators U+2028/U+2029, which are literal in JSON but illegal in JS
 * string literals) makes the payload inert while staying valid JSON-LD.
 */
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/[\u2028\u2029]/g, (c) =>
      c === "\u2028" ? "\\u2028" : "\\u2029",
    );
}

// Google maps its own employmentType vocabulary, not ours.
const EMPLOYMENT_TYPE: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  "contract-to-hire": "CONTRACTOR",
  "direct-hire": "FULL_TIME",
  "managed-teams": "CONTRACTOR",
  remote: "FULL_TIME",
};

/**
 * JobPosting structured data. Without this, listings cannot appear in Google
 * Jobs at all, the single largest source of organic traffic for a careers
 * board. Only fields we genuinely hold are emitted; Google penalises padded
 * or invented values.
 */
function jobPostingLd(job: PublicJob, id: string) {
  const remote = /remote/i.test(job.location) || job.type === "remote";
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "Ocean Blue Corporation",
      value: job.postingId || id,
    },
    datePosted: job.createdAt,
    ...(job.submissionDueDate ? { validThrough: job.submissionDueDate } : {}),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: "Ocean Blue Corporation",
      sameAs: "https://oceanbluecorp.com",
      logo: "https://oceanbluecorp.com/Logo_400x400.png",
    },
    ...(job.department ? { industry: job.department } : {}),
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        ...(job.state ? { addressRegion: job.state } : {}),
        addressCountry: "US",
      },
    },
    // Required by Google whenever the role is remote.
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "USA" } }
      : {}),
    ...(job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salary.currency || "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary.min,
              maxValue: job.salary.max,
              unitText: "YEAR",
            },
          },
        }
      : {}),
    ...(richTextToPlain(job.responsibilities) ? { responsibilities: richTextToPlain(job.responsibilities) } : {}),
    ...(richTextToPlain(job.requirements) ? { qualifications: richTextToPlain(job.requirements) } : {}),
    directApply: true,
    url: `https://oceanbluecorp.com/careers/search/${id}`,
  };
}

// Format job type for metadata
const formatJobType = (type: string) => {
  const typeMap: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "contract": "Contract",
    "contract-to-hire": "Contract-to-Hire",
    "direct-hire": "Direct Hire",
    "managed-teams": "Managed Teams",
    "remote": "Remote",
  };
  return typeMap[type] || type;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await loadJob(id);

    // layout.tsx has already 404'd a missing job by the time this runs; the
    // branch only exists so the type narrows.
    if (!result.success || !result.data) return {};

    const job = result.data;
    const jobType = formatJobType(job.type);
    const url = `https://oceanbluecorp.com/careers/search/${id}`;

    // Richer copy for Open Graph… (plain text: the description is stored as HTML,
    // and raw tags were landing in share cards and the search snippet)
    const fullDescription = `${jobType} position in ${job.location}. ${richTextToPlain(job.description)}`;
    const ogDescription = fullDescription.length > 300
      ? fullDescription.substring(0, 297).trimEnd() + "..."
      : fullDescription;
    // …and a version capped at 160 chars for the SEO meta description.
    const metaDescription = ogDescription.length > 160
      ? ogDescription.substring(0, 157).trimEnd() + "..."
      : ogDescription;

    return {
      // Bare job title, the layout template appends the brand suffix once.
      title: job.title,
      description: metaDescription,
      openGraph: {
        images: OG_IMAGES,
        title: `${job.title} - ${jobType} at Ocean Blue Corporation`,
        description: ogDescription,
        url,
        siteName: "Ocean Blue Corporation",
        type: "article",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${job.title} - ${jobType}`,
        description: ogDescription,
        images: OG_IMAGES,
      },
      alternates: {
        canonical: url,
      },
      other: {
        "article:author": "Ocean Blue Corporation",
        "article:section": "Careers",
        "article:tag": [job.department, jobType, job.location].join(", "),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Careers",
      description: "Explore career opportunities at Ocean Blue Corporation.",
    };
  }
}

export default async function JobDetailsPage({ params }: Props) {
  const { id } = await params;

  // No try/catch: layout.tsx already resolved this id and 404'd anything
  // missing, and wrapping notFound() swallows the NEXT_HTTP_ERROR_FALLBACK
  // signal it throws — the old catch logged that control-flow throw as
  // "Error fetching job" on every 404.
  const result = await loadJob(id);
  if (!result.success || !result.data) notFound();

  // Strip internal fields (rates, client/recruiter info) before sending to the
  // public client component.
  const job = toPublicJob(result.data);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jobPostingLd(job, id)) }}
      />
      <JobDetailsClient job={job} jobId={id} />
    </>
  );
}
