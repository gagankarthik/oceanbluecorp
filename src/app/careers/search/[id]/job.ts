import { cache } from "react";
import { getJob } from "@/lib/aws/dynamodb";

/**
 * One DynamoDB read per render pass, shared by the layout guard,
 * generateMetadata and the page itself.
 */
export const loadJob = cache(getJob);
