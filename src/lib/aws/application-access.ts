// Server-side: an application as a given staff caller may see it.
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getApplication, type ActivityEntry } from "./dynamodb";
import { viewerOf, type Claims } from "@/lib/auth/verify";
import { isVisibleApplication } from "@/lib/bench";

export const applicationNotFound = () => NextResponse.json({ error: "Application not found" }, { status: 404 });

/**
 * The record, or null when it is missing or in a colleague's private pool.
 * 404 either way: a 403 would confirm the person is in someone's pipeline.
 */
export async function loadVisibleApplication(id: string, claims: Claims) {
  const result = await getApplication(id);
  if (!result.success || !result.data) return result.success ? null : result;
  return isVisibleApplication(result.data, viewerOf(claims)) ? result : null;
}

/** Same rule for records read through other shapes of the applications table. */
export function visibleTo(claims: Claims) {
  const viewer = viewerOf(claims);
  return (app: object) => isVisibleApplication(app as Parameters<typeof isVisibleApplication>[0], viewer);
}

/** Who did it comes from the session, never the request body. */
export function actorOf(claims: Claims) {
  return { id: claims.sub, name: claims.name || claims.email || "Staff" };
}

export function activityEntry(
  claims: Claims,
  kind: ActivityEntry["kind"],
  summary: string,
  fields?: string[],
): ActivityEntry {
  const actor = actorOf(claims);
  return {
    id: uuidv4(),
    at: new Date().toISOString(),
    by: actor.id,
    byName: actor.name,
    kind,
    summary,
    ...(fields?.length && { fields }),
  };
}
