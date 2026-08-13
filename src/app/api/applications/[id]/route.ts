import { NextRequest, NextResponse, after } from "next/server";
import {
  getApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
  Application,
  NoteEntry,
} from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { requireStaff, isAdminClaims } from "@/lib/auth/verify";
import { canView } from "@/lib/bench";
import { analyzeApplicationResume } from "@/lib/aws/analyze-application";

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

    const result = await getApplication(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch application" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    /**
     * My Pool is private to the recruiter who built it (admins excepted).
     *
     * The list endpoint filters these out, but filtering a list is not access
     * control on its own: the ids are guessable from anywhere else they appear,
     * and this route would happily return the full record, resume analysis
     * included, to any staff caller who asked for one directly.
     *
     * 404 rather than 403 on purpose. A 403 confirms the record exists, which
     * is itself the thing being protected: whether a given person is in a
     * colleague's sourcing pipeline. To a caller with no right to it, the
     * record should be indistinguishable from one that was never there.
     */
    const app = result.data;
    if (app.addToTalentBench) {
      const visible = canView(app, {
        id: auth.claims.sub,
        email: auth.claims.email,
        isAdmin: isAdminClaims(auth.claims),
      });
      if (!visible) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ application: app });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Check if application exists
    const existingApp = await getApplication(id);
    if (!existingApp.success || !existingApp.data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Validate status if provided
    const validStatuses: Application["status"][] = [
      "pending",
      "reviewing",
      "submitted",
      "interview",
      "offered",
      "hired",
      "rejected",
      "active",
      "inactive",
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Handle addNote payload - append to notesHistory array
    if (body.addNote) {
      const { text, addedBy, addedByName } = body.addNote;
      if (!text || !addedBy || !addedByName) {
        return NextResponse.json(
          { error: "addNote requires text, addedBy, and addedByName" },
          { status: 400 }
        );
      }

      // Get existing notes history, or start with empty array
      let notesHistory: NoteEntry[] = existingApp.data.notesHistory || [];

      // Migrate legacy string notes if present and notesHistory is empty
      if (!notesHistory.length && existingApp.data.notes && typeof existingApp.data.notes === "string") {
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
        addedBy,
        addedByName,
      };
      notesHistory.push(newNote);

      // Update with new notes history and clear legacy notes field
      const result = await updateApplication(id, {
        notesHistory,
        notes: "", // Clear legacy notes after migration
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to add note" },
          { status: 500 }
        );
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
      body.addToTalentBench !== undefined || body.benchAddedBy !== undefined ||
      body.benchType !== undefined ||
      body.resumeAnalysis !== undefined ||
      body.visaSponsorshipRequired !== undefined || body.visaExpiry !== undefined;

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
      if (body.jobTitle !== undefined) updates.jobTitle = body.jobTitle;
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
      if (body.notesHistory !== undefined) updates.notesHistory = body.notesHistory;
      if (body.rating !== undefined) updates.rating = body.rating;

      // Talent bench flag
      if (body.addToTalentBench !== undefined) updates.addToTalentBench = body.addToTalentBench;
      if (body.benchAddedBy !== undefined) updates.benchAddedBy = body.benchAddedBy;
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

      // Handle status history for status changes
      if (isStatusChange) {
        const statusHistory = existingApp.data.statusHistory || [];
        const newHistoryEntry = {
          status: body.status,
          changedAt: new Date().toISOString(),
          changedBy: body.changedBy,
          changedByName: body.changedByName,
          notes: body.statusNote,
        };
        updates.statusHistory = [...statusHistory, newHistoryEntry];
      }

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
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to update application" },
          { status: 500 }
        );
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
        body.changedBy,
        body.changedByName
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to update application" },
          { status: 500 }
        );
      }
    }

    // Fetch updated application
    const updatedApp = await getApplication(id);

    return NextResponse.json({ application: updatedApp.data });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Check if application exists
    const existingApp = await getApplication(id);
    if (!existingApp.success || !existingApp.data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const result = await deleteApplication(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
