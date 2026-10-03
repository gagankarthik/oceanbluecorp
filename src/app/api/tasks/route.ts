import { NextRequest, NextResponse } from "next/server";
import { getApplicationsWithTasks, type Application } from "@/lib/aws/dynamodb";
import { requireStaff, viewerOf } from "@/lib/auth/verify";
import { isVisibleApplication } from "@/lib/bench";
import { serverError } from "@/lib/api-errors";

/**
 * GET /api/tasks?scope=mine|all&open=1
 * Follow-ups across candidates, soonest due first; undated ones last.
 * `mine` (default) is tasks assigned to the caller.
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("scope") !== "all";
    const openOnly = searchParams.get("open") !== "0";

    const result = await getApplicationsWithTasks();
    if (!result.success) return serverError("Listing tasks", result.error, "Couldn't load tasks. Please try again.");

    const viewer = viewerOf(auth.claims);
    const tasks = (result.data || [])
      .filter((a) => isVisibleApplication(a as Application, viewer))
      .flatMap((a) =>
        (a.tasks || []).map((t) => ({
          ...t,
          applicationId: a.id,
          candidateName: a.name,
          jobTitle: a.jobTitle,
        })),
      )
      .filter((t) => (!mine || t.assigneeId === auth.claims.sub) && (!openOnly || !t.done))
      // ISO dates sort as text; a date-only due ("2026-10-03") stays a calendar day, not UTC midnight.
      .sort((x, y) => {
        if (!x.dueAt || !y.dueAt) return (x.dueAt ? 0 : 1) - (y.dueAt ? 0 : 1) || x.createdAt.localeCompare(y.createdAt);
        return x.dueAt.localeCompare(y.dueAt) || x.createdAt.localeCompare(y.createdAt);
      });

    return NextResponse.json({ tasks });
  } catch (error) {
    return serverError("Error listing tasks", error, "Couldn't load tasks. Please try again.");
  }
}
