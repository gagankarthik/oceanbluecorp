import "server-only";
import { cache } from "react";
import { getJob as getJobRecord, getPublicJobs, toCandidateJob, type CandidateJob } from "@/lib/aws/dynamodb";
import { isAcceptingApplications } from "@/lib/job-status";
import { displayTitle, workMode } from "@/lib/careers";
import { jobPlace } from "@/lib/workplace";
import { richTextToPlain } from "@/lib/rich-text";
import { jobTypeLabel } from "@/lib/job-options";

/** A row on the public job board; the slug is the posting id. */
export type Job = {
  slug: string;
  /** The posting reference staff and candidates quote, e.g. OB-2026-0376 */
  ref?: string;
  title: string;
  practice: string;
  location: string;
  workplace: string;
  type: string;
  summary: string;
  /** ISO date it went live, for sorting by newest */
  posted: string;
  /** ISO date applications close, if the posting has one */
  closes?: string;
};

export { jobTypeLabel };

const SUMMARY_CHARS = 220;

function toBoardRow(job: CandidateJob, publishedAt?: string): Job {
  const plain = richTextToPlain(job.description).replace(/\s+/g, " ").trim();
  return {
    slug: job.id,
    ref: job.postingId || undefined,
    title: displayTitle(job.title),
    practice: job.department || "",
    location: jobPlace(job),
    workplace: workMode(job) || "",
    type: jobTypeLabel(job.type),
    summary: plain.length > SUMMARY_CHARS ? `${plain.slice(0, SUMMARY_CHARS).trimEnd()}…` : plain,
    posted: publishedAt ?? job.createdAt,
    closes: job.submissionDueDate || undefined,
  };
}

/** Open, in-date postings, newest first. Empty on a read failure so the page still renders. */
export const getOpenJobs = cache(async (): Promise<Job[]> => {
  try {
    const result = await getPublicJobs();
    if (!result.success) return [];
    return (result.data || [])
      .filter((j) => isAcceptingApplications(j))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((j) => toBoardRow(toCandidateJob(j), j.publishedAt));
  } catch {
    return [];
  }
});

/**
 * One posting for the detail page, public projection only. Drafts, on-hold,
 * closed and past-deadline postings read as missing.
 */
export const getJob = cache(async (id: string): Promise<{ job: CandidateJob; publishedAt?: string } | null> => {
  try {
    const result = await getJobRecord(id);
    if (!result.success || !result.data || !isAcceptingApplications(result.data)) return null;
    const job = toCandidateJob(result.data);
    return { job: { ...job, title: displayTitle(job.title) }, publishedAt: result.data.publishedAt };
  } catch {
    return null;
  }
});
