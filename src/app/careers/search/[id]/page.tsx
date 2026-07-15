import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJob, toPublicJob } from "@/lib/aws/dynamodb";
import JobDetailsClient from "./JobDetailsClient";

interface Props {
  params: Promise<{ id: string }>;
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
    const result = await getJob(id);

    if (!result.success || !result.data) {
      // Bare string — the root layout template adds the " | Ocean Blue
      // Corporation" suffix, so we must not repeat it here.
      return {
        title: "Job Not Found",
        description: "The job you are looking for could not be found.",
      };
    }

    const job = result.data;
    const jobType = formatJobType(job.type);
    const url = `https://oceanbluecorp.com/careers/search/${id}`;

    // Richer copy for Open Graph…
    const ogDescription = `${jobType} position in ${job.location}. ${job.description}`;
    // …and a version capped at 160 chars for the SEO meta description.
    const metaDescription = ogDescription.length > 160
      ? ogDescription.substring(0, 157).trimEnd() + "..."
      : ogDescription;

    return {
      // Bare job title — the layout template appends the brand suffix once.
      title: job.title,
      description: metaDescription,
      openGraph: {
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

  try {
    const result = await getJob(id);

    if (!result.success || !result.data) {
      notFound();
    }

    // Strip internal fields (rates, client/recruiter info) before sending to the
    // public client component.
    return <JobDetailsClient job={toPublicJob(result.data)} jobId={id} />;
  } catch (error) {
    console.error("Error fetching job:", error);
    notFound();
  }
}
