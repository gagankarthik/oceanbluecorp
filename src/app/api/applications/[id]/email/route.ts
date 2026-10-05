import { NextRequest, NextResponse } from "next/server";
import { updateApplication } from "@/lib/aws/dynamodb";
import { sendCandidateEmail } from "@/lib/aws/ses";
import { requireStaff } from "@/lib/auth/verify";
import {
  loadVisibleApplication, applicationNotFound, actorOf, activityEntry,
} from "@/lib/aws/application-access";
import { buildIcs } from "@/lib/ics";
import { unfilledPlaceholders } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-errors";

// A recruiter can email bursts of candidates, not run a mailing list from here.
const EMAIL_LIMIT = { action: "candidate-email", limit: 60, windowSeconds: 3600 };

/**
 * POST /api/applications/[id]/email
 * Body: { subject, body, interview?: { start, durationMinutes, location? } }
 *
 * The recipient is always the candidate on file, never the body. Replies go to
 * the sending recruiter. An `interview` attaches a calendar invite.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const limited = await checkRateLimit(request, EMAIL_LIMIT, `user:${auth.claims.sub}`);
    if (!limited.allowed) return limited.response!;

    const app = await loadVisibleApplication(id, auth.claims);
    if (!app?.success || !app.data) return applicationNotFound();
    if (!app.data.email) {
      return NextResponse.json({ error: "This candidate has no email address on file." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!subject || !text) return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });
    if (subject.length > 200) return NextResponse.json({ error: "Keep the subject under 200 characters." }, { status: 400 });
    if (text.length > 10_000) return NextResponse.json({ error: "Keep the message under 10,000 characters." }, { status: 400 });
    const unfilled = unfilledPlaceholders(`${subject}\n${text}`);
    if (unfilled.length) {
      return NextResponse.json({ error: `Fill in or remove: ${unfilled.map((p) => `{{${p}}}`).join(", ")}` }, { status: 400 });
    }

    let ics: string | undefined;
    if (body?.interview) {
      const start = new Date(body.interview.start);
      const minutes = Number(body.interview.durationMinutes) || 30;
      if (Number.isNaN(start.getTime()) || minutes < 5 || minutes > 600) {
        return NextResponse.json({ error: "Give the interview a valid start time and length." }, { status: 400 });
      }
      const actor = actorOf(auth.claims);
      ics = buildIcs({
        uid: `${id}-${start.getTime()}@oceanbluecorp.com`,
        start,
        durationMinutes: minutes,
        title: `Interview: ${app.data.jobTitle || "Oceanblue"}`,
        description: text,
        location: typeof body.interview.location === "string" ? body.interview.location.slice(0, 500) : undefined,
        organizer: auth.claims.email ? { name: actor.name, email: auth.claims.email } : undefined,
        attendees: [{ name: app.data.name, email: app.data.email }],
      });
    }

    const sent = await sendCandidateEmail({
      to: app.data.email,
      subject,
      body: text,
      replyTo: auth.claims.email,
      senderName: auth.claims.name,
      ics,
    });
    if (!sent.success) {
      return serverError("Emailing candidate", sent.error, "The email couldn't be sent. Please try again.");
    }

    await updateApplication(id, {}, [], {
      activity: [activityEntry(auth.claims, "email", `Emailed: ${subject}${ics ? " (with calendar invite)" : ""}`)],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error emailing candidate", error, "The email couldn't be sent. Please try again.");
  }
}
