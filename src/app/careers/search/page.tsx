import { getAllJobs, toPublicJob, type PublicJob } from "@/lib/aws/dynamodb";
import { isPubliclyOpen } from "@/lib/job-status";
import JobBoard from "./job-board";

// Re-read postings at most once a minute, like the rest of the public site.
export const revalidate = 60;

/**
 * Open roles, loaded on the server so the list is in the first HTML: faster
 * first paint, and indexable. Same rule /api/jobs applies to an anonymous
 * caller: open statuses only, public projection only (no rates, client,
 * vendor or assignees). Null on failure, and the board fetches for itself.
 */
async function loadOpenJobs(): Promise<PublicJob[] | null> {
  try {
    const result = await getAllJobs();
    if (!result.success) return null;
    return (result.data || [])
      .filter((j) => isPubliclyOpen(j.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(toPublicJob);
  } catch {
    return null;
  }
}

export default async function CareersSearchPage() {
  const jobs = await loadOpenJobs();
  return <JobBoard initialJobs={jobs} />;
}
