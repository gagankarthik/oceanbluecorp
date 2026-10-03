// The contact page has two paths. Job-seeker enquiries carry an inquiryType
// prefixed "Job Seeker" and no company.

export const JOB_SEEKER_PREFIX = "Job Seeker";

export const isJobSeeker = (inquiryType: unknown): boolean =>
  typeof inquiryType === "string" && inquiryType.startsWith(JOB_SEEKER_PREFIX);

/** "Job Seeker - Cloud & DevOps" -> "Cloud & DevOps" */
export const seekerArea = (inquiryType: string): string =>
  inquiryType.replace(/^Job Seeker\s*-\s*/, "") || "Not specified";
