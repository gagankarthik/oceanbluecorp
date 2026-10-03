import { NextRequest, NextResponse } from "next/server";
import { sendJobUpdatedNotifications } from "@/lib/aws/ses";
import { getJob } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";
import { jobTeamRecipients } from "@/lib/job-input";
import { serverError } from "@/lib/api-errors";

// Recipients, title and sender all come from the job and the session. The body
// only names the job and what changed, so this can't mail arbitrary addresses.
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json().catch(() => null);
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    if (!jobId) {
      return NextResponse.json({ error: "Missing required field: jobId" }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job.success || !job.data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const changes = Array.isArray(body.changes)
      ? body.changes.filter((c: unknown): c is string => typeof c === "string").slice(0, 50).map((c: string) => c.slice(0, 300))
      : [];

    const recipients = jobTeamRecipients(job.data);
    if (recipients.length === 0) {
      return NextResponse.json({ success: true, message: "No recipients to notify" });
    }

    const result = await sendJobUpdatedNotifications(recipients, {
      jobTitle: job.data.title,
      jobId,
      postingId: job.data.postingId,
      updatedByName: auth.claims.name || auth.claims.email || "Staff",
      changes,
    });

    return NextResponse.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    return serverError("[NOTIFY-UPDATE] Error", error, "Couldn't send the update notifications. Please try again.");
  }
}
