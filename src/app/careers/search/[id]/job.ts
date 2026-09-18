import { cache } from "react";
import { getJob } from "@/lib/aws/dynamodb";
import { isPubliclyOpen } from "@/lib/job-status";

/**
 * One DynamoDB read per render pass, shared by the layout guard,
 * generateMetadata and the page itself. Drafts, on-hold and closed postings
 * read as missing, so the public never sees an unpublished job by URL.
 */
export const loadJob = cache(async (id: string) => {
  const result = await getJob(id);
  if (result.success && result.data && !isPubliclyOpen(result.data.status)) {
    return { success: false as const, error: "Job not found" };
  }
  return result;
});
