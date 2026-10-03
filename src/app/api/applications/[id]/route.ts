import { NextRequest, NextResponse, after } from "next/server";
import {
  getApplication,
  getJob,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
  Application,
  NoteEntry,
  createNotification,
} from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { requireStaff } from "@/lib/auth/verify";
import {
  loadVisibleApplication as loadVisible, applicationNotFound as notFound, actorOf, activityEntry,
} from "@/lib/aws/application-access";
import { analyzeApplicationResume } from "@/lib/aws/analyze-application";
import { serverError } from "@/lib/api-errors";
import { applicationInputError, changedFields, changeKind, describeChange } from "@/lib/application-input";
import { isUrl, normalizeWebsite } from "@/lib/form-validation";

// Attaching a resume on update kicks off the extraction Lambda via after();
// its multi-agent pipeline runs 30–90s, so the invocation needs the headroom.
export const maxDuration = 120;

// GET /api/applications/[id] - Get a specific application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // My Pool is private to its recruiter (admins excepted). 404, not 403: a
    // 403 would confirm the person is in a colleague's pipeline.
    const result = await loadVisible(id, auth.claims);
    if (!result) return notFound();
    if (!result.success) {
      return serverError("Fetching application", result.error, "Couldn't load the application. Please try again.");
    }

    return NextResponse.json({ application: result.data });
  } catch (error) {
    return serverError("Error fetching application", error, "Couldn't load the application. Please try again.");
  }
}

// PUT /api/applications/[id] - Update application (supports full updates and status changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();
    const actor = actorOf(auth.claims);

    const existingApp = await loadVisible(id, auth.claims);
    if (!existingApp?.success || !existingApp.data) return notFound();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }
    const invalid = applicationInputError(body);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    // Handle addNote payload - append to notesHistory array
    if (body.addNote) {
      const text = typeof body.addNote.text === "string" ? body.addNote.text.trim() : "";
      if (!text) {
        return NextResponse.json({ error: "addNote requires text" }, { status: 400 });
      }
      if (text.length > 5000) {
        return NextResponse.json({ error: "Keep the note under 5,000 characters." }, { status: 400 });
      }

      const notesHistory: NoteEntry[] = [];

      // Migrate legacy string notes if present and notesHistory is empty
      if (!existingApp.data.notesHistory?.length && existingApp.data.notes && typeof existingApp.data.notes === "string") {
        notesHistory.push({
          id: "legacy",
          text: existingApp.data.notes,
          addedAt: existingApp.data.appliedAt || existingApp.data.createdAt || new Date().toISOString(),
          addedBy: "system",
          addedByName: "Legacy Note",
        });
      }

      // Add new note
      const newNote: NoteEntry = {
        id: uuidv4(),
        text,
        addedAt: new Date().toISOString(),
        addedBy: actor.id,
        addedByName: actor.name,
      };
      notesHistory.push(newNote);

      // Appended in place so two people noting at once both land.
      const result = await updateApplication(
        id,
        notesHistory.length > 1 ? { notes: "" } : {},
        [],
        { notesHistory },
      );

      if (!result.success) {
        return serverError("Adding application note", result.error, "Couldn't add the note. Please try again.");
      }

      // Fetch updated application
      const updatedApp = await getApplication(id);
      return NextResponse.json({ application: updatedApp.data });
    }

    // Check if this is a status change or a full update
    const isStatusChange = body.status && body.status !== existingApp.data.status;
    // Hiring a candidate moves them onto the internal bench automatically, so
    // a hire must go through the full-update path even when the request is a
    // bare status change.
    const isHire = isStatusChange && body.status === "hired";
    const hasFullUpdateFields = body.firstName || body.lastName || body.address ||
      body.city || body.state || body.workAuthorization || body.source ||
      body.ownership !== undefined || body.skills || body.experience || body.jobId !== undefined ||
      body.resumeId !== undefined || body.resumeFileName !== undefined ||
      body.resumeFileKey !== undefined || body.hireType !== undefined ||
      body.addToTalentBench !== undefined || body.benchType !== undefined ||
      body.resumeAnalysis !== undefined ||
      body.visaSponsorshipRequired !== undefined || body.visaExpiry !== undefined ||
      body.linkedinUrl !== undefined;

    if (hasFullUpdateFields || isHire) {
      // Full application update
      const updates: Partial<Application> = {};

      // Update name fields
      if (body.firstName !== undefined) updates.firstName = body.firstName;
      if (body.lastName !== undefined) updates.lastName = body.lastName;
      if (body.firstName || body.lastName) {
        updates.name = body.name || `${body.firstName || existingApp.data.firstName || ""} ${body.lastName || existingApp.data.lastName || ""}`.trim();
      } else if (body.name !== undefined) {
        updates.name = body.name;
      }

      // Contact info
      if (body.email !== undefined) updates.email = body.email;
      if (body.phone !== undefined) updates.phone = body.phone;
      if (body.linkedinUrl !== undefined) {
        const url = body.linkedinUrl ? normalizeWebsite(body.linkedinUrl) : "";
        if (url && !isUrl(url)) {
          return NextResponse.json({ error: "Enter a LinkedIn address, like linkedin.com/in/jane-smith." }, { status: 400 });
        }
        updates.linkedinUrl = url;
      }

      // Address
      if (body.address !== undefined) updates.address = body.address;
      if (body.city !== undefined) updates.city = body.city;
      if (body.state !== undefined) updates.state = body.state;
      if (body.zipCode !== undefined) updates.zipCode = body.zipCode;

      // Application details
      if (body.status !== undefined) updates.status = body.status;
      if (body.jobId !== undefined) updates.jobId = body.jobId;

      /**
       * Moving a candidate to a different job invalidates their fit score.
       *
       * The verdict is cached on the application as `{ jobFit, jobFitAt }` and
       * was scored against whichever requisition they were on at the time. Move
       * them and nothing cleared it, so the card went on presenting a number
       * computed for a job the candidate is no longer applying to, as the fit
       * for the one they are. A stale score is worse than none: it is confident
       * and specific, so nobody thinks to question it.
       *
       * Cleared here rather than only marked stale, because this is the one
       * place every move goes through, and it fixes records written before
       * `jobFitJobId` existed too, they carry no job to compare against.
       */
      if (body.jobId !== undefined && body.jobId !== existingApp.data.jobId) {
        updates.jobFit = undefined;
        updates.jobFitAt = "";
        updates.jobFitJobId = "";
      }
      // The title always comes from the job, so it can't drift from it.
      if (body.jobId !== undefined && body.jobId !== existingApp.data.jobId) {
        const job = body.jobId ? await getJob(body.jobId) : null;
        updates.jobTitle = job?.data?.title ?? "";
      }
      if (body.source !== undefined) updates.source = body.source;
      if (body.workAuthorization !== undefined) updates.workAuthorization = body.workAuthorization;
      if (body.hireType !== undefined) updates.hireType = body.hireType;
      // Visa details, the edit form omits visaExpiry entirely when it is blank,
      // so an explicit "" is the only way it can be cleared.
      if (body.visaSponsorshipRequired !== undefined) updates.visaSponsorshipRequired = body.visaSponsorshipRequired;
      if (body.visaExpiry !== undefined) updates.visaExpiry = body.visaExpiry;
      if (body.ownership !== undefined) {
        updates.ownership = body.ownership;
        // Set ownershipClaimedAt when ownership is claimed, clear when released
        if (body.ownership) {
          updates.ownershipClaimedAt = new Date().toISOString();
        } else {
          updates.ownershipClaimedAt = "";
        }
      }
      if (body.ownershipName !== undefined) updates.ownershipName = body.ownershipName;

      // Skills & experience
      if (body.skills !== undefined) updates.skills = body.skills;
      if (body.experience !== undefined) updates.experience = body.experience;
      if (body.coverLetter !== undefined) updates.coverLetter = body.coverLetter;

      // Notes & rating
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.rating !== undefined) updates.rating = body.rating;

      // Talent bench flag. Whoever puts a record on the bench owns it, which
      // decides who can see a My Pool entry, so it comes from the session.
      if (body.addToTalentBench !== undefined) updates.addToTalentBench = body.addToTalentBench;
      if (body.addToTalentBench && !existingApp.data.addToTalentBench) {
        updates.benchAddedBy = auth.claims.email || auth.claims.sub;
      }
      if (body.benchType !== undefined) updates.benchType = body.benchType;

      // Hiring moves the candidate onto the internal bench: they are now one
      // of our own consultants. An explicit benchType in the same request
      // still wins.
      if (isHire) {
        updates.addToTalentBench = body.addToTalentBench ?? true;
        if (body.benchType === undefined) updates.benchType = "internal";
      }

      // Resume fields
      if (body.resumeId !== undefined) updates.resumeId = body.resumeId;
      if (body.resumeFileName !== undefined) updates.resumeFileName = body.resumeFileName;
      if (body.resumeFileKey !== undefined) updates.resumeFileKey = body.resumeFileKey;

      // Resume analysis (manual edits from the candidate page)
      if (body.resumeAnalysis !== undefined) {
        updates.resumeAnalysis = body.resumeAnalysis;
        updates.resumeAnalysisStatus = "completed";
        updates.resumeAnalyzedAt = body.resumeAnalyzedAt || new Date().toISOString();
      }

      /**
       * A resume arriving on an update gets parsed, exactly as one arriving on
       * create does. Until now only POST queued analysis, so a resume attached
       * from the bench form or the applicant drawer sat on S3 unread and the
       * candidate page offered a manual "Analyze resume" button nobody knew to
       * press.
       *
       * Queued only when the attached file actually changed, so re-saving a
       * profile does not re-run a 90-second LLM pipeline for nothing. A manual
       * resumeAnalysis edit in the same request wins, that is someone
       * correcting the extraction by hand, and re-parsing would overwrite it.
       */
      const newResumeId = typeof updates.resumeId === "string" ? updates.resumeId : undefined;
      const resumeChanged = !!newResumeId
        && newResumeId !== existingApp.data.resumeId
        && body.resumeAnalysis === undefined;

      // Detaching the resume: an empty id where one used to be. The parsed
      // detail goes with it, leaving it behind would describe a document the
      // record no longer has.
      const resumeDetached = newResumeId === "" && !!existingApp.data.resumeId;

      if (resumeChanged) {
        updates.resumeAnalysisStatus = "pending";
        updates.resumeAnalysisError = "";
        // A new document starts with a clean slate. Without this a record that
        // had exhausted its retry budget, or was marked a dead end because the
        // OLD file was a scan, would refuse to analyse the new one.
        updates.resumeAnalysisAttempts = 0;
        updates.resumeAnalysisRetryable = false;
      }
      if (resumeDetached) {
        updates.resumeAnalysisError = "";
        updates.resumeAnalysisAttempts = 0;
        updates.resumeAnalysisRetryable = false;
      }

      const statusEntry = isStatusChange
        ? [{
            status: body.status,
            changedAt: new Date().toISOString(),
            changedBy: actor.id,
            changedByName: actor.name,
            notes: typeof body.statusNote === "string" ? body.statusNote : undefined,
          }]
        : undefined;

      // Stage moves have their own history; everything else goes in the change log.
      const edited = changedFields(existingApp.data as unknown as Record<string, unknown>, updates).filter((f) => f !== "status");
      const logEntry = edited.length
        ? [activityEntry(auth.claims, changeKind(edited), describeChange(edited), edited)]
        : undefined;

      const result = await updateApplication(
        id,
        updates,
        // The previous document's parsed detail must not survive its
        // replacement or removal, so it is deleted rather than left to look
        // current.
        resumeChanged
          ? ["resumeAnalysis", "resumeAnalyzedAt", "jobFit", "jobFitAt"]
          : resumeDetached
            ? ["resumeAnalysis", "resumeAnalyzedAt", "jobFit", "jobFitAt", "resumeAnalysisStatus"]
            : [],
        { statusHistory: statusEntry, activity: logEntry },
      );

      if (!result.success) {
        return serverError("Updating application", result.error, "Couldn't save the application. Please try again.");
      }

      if (resumeChanged) {
        after(async () => {
          try {
            await analyzeApplicationResume(id, auth.claims.sub);
          } catch (err) {
            console.error("Resume analysis after update failed:", err);
          }
        });
      }
    } else {
      // Simple status/notes/rating update
      const result = await updateApplicationStatus(
        id,
        body.status || existingApp.data.status,
        body.notes,
        body.rating,
        actor.id,
        actor.name,
      );

      if (!result.success) {
        return serverError("Updating application", result.error, "Couldn't save the application. Please try again.");
      }
    }

    // Fetch updated application
    const updatedApp = await getApplication(id);

    return NextResponse.json({ application: updatedApp.data });
  } catch (error) {
    return serverError("Error updating application", error, "Couldn't save the application. Please try again.");
  }
}

// DELETE /api/applications/[id] - Delete an application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    const existingApp = await loadVisible(id, auth.claims);
    if (!existingApp?.success || !existingApp.data) return notFound();

    const result = await deleteApplication(id);

    if (!result.success) {
      return serverError("Deleting application", result.error, "Couldn't delete the application. Please try again.");
    }

    // The record is gone, so the trail lives in an admin-only notification.
    const gone = existingApp.data;
    const actor = actorOf(auth.claims);
    after(async () => {
      try {
        await createNotification({
          id: uuidv4(),
          type: "application_deleted",
          title: "Candidate deleted",
          message: `${actor.name} deleted ${gone.name || gone.email}${gone.jobTitle ? ` (${gone.jobTitle})` : ""}`,
          relatedId: id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to record application deletion:", err);
      }
    });

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error) {
    return serverError("Error deleting application", error, "Couldn't delete the application. Please try again.");
  }
}
