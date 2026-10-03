import { cache } from "react";
import { getJob } from "@/lib/aws/dynamodb";
import { isAcceptingApplications } from "@/lib/job-status";

/**
 * One DynamoDB read per render pass, shared by the layout guard,
 * generateMetadata and the page itself. Drafts, on-hold, closed and
 * past-deadline postings read as missing, so the public never sees a job it
 * cannot apply to by URL.
 */
export const loadJob = cache(async (id: string) => {
  const result = await getJob(id);
  if (result.success && result.data && !isAcceptingApplications(result.data)) {
    return { success: false as const, error: "Job not found" };
  }
  return result;
});
