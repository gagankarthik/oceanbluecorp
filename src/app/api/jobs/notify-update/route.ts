import { NextRequest, NextResponse } from "next/server";
import { sendJobUpdatedNotifications } from "@/lib/aws/ses";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { recipients, jobTitle, jobId, postingId, updatedByName, changes } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: true, message: "No recipients to notify" });
    }

    if (!jobTitle || !jobId || !updatedByName) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle, jobId, updatedByName" },
        { status: 400 }
      );
    }

    const result = await sendJobUpdatedNotifications(recipients, {
      jobTitle,
      jobId,
      postingId,
      updatedByName,
      changes: changes || [],
    });

    console.log(`[NOTIFY-UPDATE] Sent ${result.sent} notifications, ${result.failed} failed for job ${jobId}`);

    return NextResponse.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    return serverError("[NOTIFY-UPDATE] Error", error, "Couldn't send the update notifications. Please try again.");
  }
}
