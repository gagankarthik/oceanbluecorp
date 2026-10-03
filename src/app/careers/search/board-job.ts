import type { PublicJob } from "@/lib/aws/dynamodb";
import { richTextToPlain } from "@/lib/rich-text";

/**
 * What a board row needs. The full HTML description, requirements and
 * responsibilities stay on the job page; search matches a plain-text excerpt.
 */
export type BoardJob = Omit<PublicJob, "description" | "requirements" | "responsibilities"> & { excerpt: string };

const EXCERPT_CHARS = 400;

export function toBoardJob({ description, requirements: _r, responsibilities: _s, ...rest }: PublicJob): BoardJob {
  const plain = richTextToPlain(description).replace(/\s+/g, " ").trim();
  return { ...rest, excerpt: plain.length > EXCERPT_CHARS ? plain.slice(0, EXCERPT_CHARS) : plain };
}
