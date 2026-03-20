import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/aws/dynamodb";
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
      return {
        title: "Job Not Found | Ocean Blue Corporation",
        description: "The job you are looking for could not be found.",
      };
    }

    const job = result.data;
    const jobType = formatJobType(job.type);
    const title = `${job.title} | Ocean Blue Corporation`;
    const description = job.description.length > 160
      ? job.description.substring(0, 157) + "..."
      : job.description;
    const url = `https://oceanbluecorp.com/careers/${id}`;

    // Create a more detailed description for Open Graph
    const ogDescription = `${jobType} position in ${job.location}. ${description}`;

    return {
      title,
      description: ogDescription,
      openGraph: {
        title: `${job.title} - ${jobType} at Ocean Blue Corporation`,
        description: ogDescription,
        url,
        siteName: "Ocean Blue Corporation",
        type: "article",
        locale: "en_US",
        images: [
          {
            url: "https://oceanbluecorp.com/logo.png",
            width: 200,
            height: 200,
            alt: `${job.title} at Ocean Blue Corporation`,
          },
        ],
      },
      twitter: {
        card: "summary",
        title: `${job.title} - ${jobType}`,
        description: ogDescription,
        images: ["https://oceanbluecorp.com/logo.png"],
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
      title: "Careers | Ocean Blue Corporation",
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

    return <JobDetailsClient job={result.data} jobId={id} />;
  } catch (error) {
    console.error("Error fetching job:", error);
    notFound();
  }
}
