import { Metadata } from "next";
import { breadcrumbJsonLd, jsonLdString, OG_IMAGES } from "@/lib/seo";
import { workMode } from "@/lib/careers";
import { currencyCode, salaryUnitText } from "@/lib/salary";
import { notFound } from "next/navigation";
import { toPublicJob, type PublicJob } from "@/lib/aws/dynamodb";
import { richTextToPlain } from "@/lib/rich-text";
import JobDetailsClient from "./JobDetailsClient";
import { loadJob } from "./job";

interface Props {
  params: Promise<{ id: string }>;
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
 * "Columbus, OH (Hybrid)" → locality + region. A bare value is a city unless it
 * matches the posting's state. Free text that does not parse stays a locality.
 */
function postalAddress(location: string, state?: string) {
  const clean = location
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(hybrid|on-?site)\b/gi, "")
    .replace(/^[\s,–-]+|[\s,–-]+$/g, "")
    .trim();
  const parts = clean.split(",").map((p) => p.trim()).filter(Boolean);
  let locality: string | undefined = parts[0];
  let region = state?.trim() || undefined;
  if (parts.length >= 2) {
    region = region || parts[1].replace(/\s+\d{5}(-\d{4})?$/, "");
  } else if (locality && region && locality.toLowerCase() === region.toLowerCase()) {
    locality = undefined;
  } else if (locality && /^[A-Z]{2}$/.test(locality)) {
    region = region || locality;
    locality = undefined;
  }
  return {
    "@type": "PostalAddress",
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    addressCountry: "US",
  };
}

/** The deadline is a calendar date; the posting stays open through that day. */
function endOfDay(date: string) {
  return `${date.slice(0, 10)}T23:59:59`;
}

/**
 * JobPosting structured data. Without this, listings cannot appear in Google
 * Jobs at all, the single largest source of organic traffic for a careers
 * board. Only fields we genuinely hold are emitted; Google penalises padded
 * or invented values.
 */
function jobPostingLd(job: PublicJob, id: string, publishedAt?: string) {
  const remote = workMode(job) === "Remote";
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "Oceanblue Solutions, Inc.",
      value: job.postingId || id,
    },
    datePosted: publishedAt ?? job.createdAt,
    ...(job.submissionDueDate ? { validThrough: endOfDay(job.submissionDueDate) } : {}),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: "Oceanblue Solutions, Inc.",
      sameAs: "https://oceanbluecorp.com",
      logo: "https://oceanbluecorp.com/Logo_400x400.png",
    },
    ...(job.department ? { industry: job.department } : {}),
    // Fully remote: Google wants TELECOMMUTE plus where applicants may live, and no jobLocation.
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "US" } }
      : { jobLocation: { "@type": "Place", address: postalAddress(job.location || "", job.state) } }),
    ...(job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: currencyCode(job.salary.currency),
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary.min,
              maxValue: job.salary.max,
              unitText: salaryUnitText(job.salary),
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
    const capped = ogDescription.length > 160
      ? ogDescription.substring(0, 157).trimEnd() + "..."
      : ogDescription;
    // A posting with a thin description still gets a full snippet.
    const metaDescription = capped.length < 110
      ? `${capped.replace(/\.*$/, "")}. Apply online for the ${job.title} role at Oceanblue Solutions, Inc.`
      : capped;

    return {
      // Bare job title, the layout template appends the brand suffix once.
      title: job.title,
      description: metaDescription,
      openGraph: {
        images: OG_IMAGES,
        title: `${job.title} - ${jobType} at Oceanblue Solutions, Inc.`,
        description: ogDescription,
        url,
        siteName: "Oceanblue Solutions, Inc.",
        type: "article",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${job.title} - ${jobType}`,
        description: ogDescription,
      },
      alternates: {
        canonical: url,
      },
      other: {
        "article:author": "Oceanblue Solutions, Inc.",
        "article:section": "Careers",
        "article:tag": [job.department, jobType, job.location].join(", "),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Careers",
      description: "Explore career opportunities at Oceanblue Solutions, Inc.",
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
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            jobPostingLd(job, id, result.data.publishedAt),
            breadcrumbJsonLd([
              { name: "Careers", path: "/careers" },
              { name: "Open jobs", path: "/careers/search" },
              { name: job.title, path: `/careers/search/${id}` },
            ]),
          ]),
        }}
      />
      <JobDetailsClient job={job} jobId={id} publishedAt={result.data.publishedAt} />
    </>
  );
}
