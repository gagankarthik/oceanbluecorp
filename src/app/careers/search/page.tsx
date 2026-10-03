import { getPublicJobs, toPublicJob } from "@/lib/aws/dynamodb";
import { isAcceptingApplications } from "@/lib/job-status";
import JobBoard from "./job-board";
import { toBoardJob, type BoardJob } from "./board-job";

// Re-read postings at most once a minute, like the rest of the public site.
export const revalidate = 60;

/**
 * Open roles, loaded on the server so the list is in the first HTML: faster
 * first paint, and indexable. Same rule /api/jobs applies to an anonymous
 * caller (open statuses, public projection), minus past-deadline postings, and
 * trimmed to what a row shows. Null on failure, and the board fetches for itself.
 */
async function loadOpenJobs(): Promise<BoardJob[] | null> {
  try {
    const result = await getPublicJobs();
    if (!result.success) return null;
    return (result.data || [])
      .filter((j) => isAcceptingApplications(j))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((j) => toBoardJob(toPublicJob(j)));
  } catch {
    return null;
  }
}

export default async function CareersSearchPage() {
  const jobs = await loadOpenJobs();
  return <JobBoard initialJobs={jobs} />;
}
