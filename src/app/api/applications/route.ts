import { NextRequest, NextResponse, after } from "next/server";
import {
  getAllApplications,
  getApplicationsByJob,
  getApplicationsByUser,
  createApplication,
  createNotification,
  Application,
  getJob,
  updateJob,
  getNextApplicationId,
} from "@/lib/aws/dynamodb";
import {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
} from "@/lib/aws/ses";
import { v4 as uuidv4 } from "uuid";
import { requireStaff, getClaims, isAdminClaims } from "@/lib/auth/verify";
import { hasStaffAccess } from "@/lib/auth/config";
import { canView } from "@/lib/bench";
import { analyzeApplicationResume } from "@/lib/aws/analyze-application";
import type { ResumeAnalysis } from "@/lib/aws/dynamodb";
import { candidateHaystack } from "@/lib/candidate-search";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Resume analysis runs after the response via after(); give the invocation room
// for the LLM pipeline (30–90s) without delaying the applicant's response.
export const maxDuration = 120;

// GET /api/applications - Get applications (with optional filters)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");
    const email = searchParams.get("email");

    let result;
    let applications: Application[] = [];

    if (userId) {
      // Query by userId index
      result = await getApplicationsByUser(userId);
      if (result.success) {
        applications = result.data || [];
      }

      // Also check if userId looks like an email - if so, also search by email field
      // This handles cases where userId was stored as email for anonymous users
      if (userId.includes("@")) {
        const allAppsResult = await getAllApplications();
        if (allAppsResult.success && allAppsResult.data) {
          const emailMatches = allAppsResult.data.filter(
            (app) => app.email?.toLowerCase() === userId.toLowerCase() &&
                     !applications.some((a) => a.id === app.id)
          );
          applications = [...applications, ...emailMatches];
        }
      }
    } else if (email) {
      // Search by email field (scan with filter)
      const allAppsResult = await getAllApplications();
      if (allAppsResult.success && allAppsResult.data) {
        applications = allAppsResult.data.filter(
          (app) => app.email?.toLowerCase() === email.toLowerCase()
        );
      }
    } else if (jobId) {
      result = await getApplicationsByJob(jobId);
      if (result.success) {
        applications = result.data || [];
      }
    } else {
      result = await getAllApplications();
      if (result.success) {
        applications = result.data || [];
      }
    }

    /**
     * My Pool stays private, and it has to be enforced HERE.
     *
     * The rule: Talent Bench (internal) is company property and every staff
     * member sees all of it; My Pool (external) is the recruiter's own sourced
     * pipeline and is visible only to whoever added it, plus admins, who audit
     * the team's pipeline.
     *
     * That rule was implemented in exactly one place — a `canView` call in the
     * browser, in `admin/bench/page.tsx` — while this endpoint returned every
     * application to every staff caller. The list on screen looked right, but
     * one recruiter's private pool was sitting in the JSON delivered to every
     * other recruiter's browser, readable from the network tab without any
     * particular effort. UI gating is courtesy; this is the authorization it
     * was standing in for.
     *
     * Scoped to `addToTalentBench` deliberately. `canView` resolves a record's
     * pool via `poolOf`, which falls back to "external" for anything not hired
     * — so filtering every application through it would hide most of the
     * pipeline from everyone on every other screen that reads this endpoint.
     * Only records actually on the bench carry the visibility rule.
     */
    const viewer = {
      id: auth.claims.sub,
      email: auth.claims.email,
      isAdmin: isAdminClaims(auth.claims),
    };
    applications = applications.filter(
      (app) => !app.addToTalentBench || canView(app, viewer),
    );

    // Sort by appliedAt descending (newest first)
    applications.sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    /**
     * Lists go out lean.
     *
     * A parsed resume is ~14KB of work history, skills, projects and
     * certifications, and this endpoint was sending all of it for every
     * candidate: 2.76MB across 174 records, 88% of it analysis, growing linearly
     * with the database. `searchText` replaces it with the few hundred bytes the
     * browser actually needs to filter on, and the detail screens read the full
     * record by key as they already did.
     */
    const lean = applications.map((app) => {
      const { resumeAnalysis, ...rest } = app;
      return {
        ...rest,
        // Computed from the full record before it is dropped.
        searchText: candidateHaystack(app),
        // Kept so a list row can still say "analysed" without carrying the analysis.
        hasResumeAnalysis: !!resumeAnalysis,
      };
    });

    return NextResponse.json({ applications: lean });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create a new application (supports both portal and HR-created)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // This route is open — the public careers portal posts through it — so a
    // client-supplied analysis is only trusted from a verified staff session.
    // The new-applicant screen already ran the extraction to fill its form, and
    // sends it here so the same document isn't put through the pipeline twice.
    // An anonymous caller's resumeAnalysis is ignored, not rejected: their
    // application must still go through, and it gets analysed server-side below.
    const claims = await getClaims(request);
    const isStaff = !!claims && hasStaffAccess(claims.groups);

    // Throttle anonymous callers only. A recruiter entering a batch of candidates
    // is a legitimate burst; an unauthenticated script hitting this in a loop
    // writes rows, runs an LLM extraction and sends an email per iteration.
    if (!isStaff) {
      const limited = await checkRateLimit(request, RATE_LIMITS.application);
      if (!limited.allowed) return limited.response!;
    }

    const suppliedAnalysis: ResumeAnalysis | undefined =
      isStaff
        && body.resumeAnalysis && typeof body.resumeAnalysis === "object" && !Array.isArray(body.resumeAnalysis)
        ? (body.resumeAnalysis as ResumeAnalysis)
        : undefined;

    /**
     * Fields only staff may set.
     *
     * This route is open so the public careers portal can post applications, and
     * it used to take every field straight off the body — which let an anonymous
     * applicant file themselves as `status: "hired"`, claim `ownership`, seed the
     * internal `notes` a recruiter would later read as a colleague's, hand
     * themselves a `rating`, or add themselves to the talent bench. A public
     * caller now gets the safe defaults; nothing is rejected, so a genuine
     * application still goes through.
     */
    const staffOnly = <T,>(value: T, fallback: T): T => (isStaff ? value : fallback);

    // For HR-created applications, email is required. For portal, jobId and email are required.
    if (!body.email) {
      return NextResponse.json(
        { error: "Missing required field: email" },
        { status: 400 }
      );
    }

    // Get name from body or combine firstName + lastName
    const name = body.name || (body.firstName && body.lastName
      ? `${body.firstName} ${body.lastName}`
      : body.firstName || body.lastName || "Unknown");

    let job = null;
    let isPortalApplication = false;

    // If jobId is provided, validate the job
    if (body.jobId) {
      const jobResult = await getJob(body.jobId);
      if (jobResult.success && jobResult.data) {
        job = jobResult.data;
        // Only check active status for portal applications (not HR-created)
        if (!body.createdBy && job.status !== "active") {
          return NextResponse.json(
            { error: "This job is no longer accepting applications" },
            { status: 400 }
          );
        }
        isPortalApplication = !body.createdBy;
      }
    }

    // Generate application ID (APP-YEAR-XXXX format, e.g., APP-2026-0001)
    let applicationId: string | undefined;
    try {
      applicationId = await getNextApplicationId();
    } catch (err) {
      console.error("Failed to generate application ID:", err);
      // Continue without applicationId - will use UUID prefix as fallback
    }

    const now = new Date().toISOString();

    const application: Application = {
      id: uuidv4(),
      applicationId,
      userId: body.userId || "anonymous",
      jobId: body.jobId || undefined,
      jobTitle: body.jobTitle || job?.title || undefined,
      resumeId: body.resumeId || undefined,
      resumeFileName: body.resumeFileName || undefined,
      // The S3 key was collected by every upload path but dropped here, so no
      // record ever carried one and anything reading resumeFileKey saw blank.
      resumeFileKey: body.resumeFileKey || undefined,
      // Queue resume analysis when a resume is attached; the background task
      // below flips this to processing/completed/failed.
      resumeAnalysisStatus: body.resumeId ? "pending" : undefined,
      // An analysis handed in by staff is stored by that same background task,
      // which also indexes the candidate and scores them against the job.
      // A public applicant is always "pending"; only staff may file a stage.
      status: staffOnly(body.status || "pending", "pending"),
      appliedAt: now,
      createdAt: now,
      name,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      skills: body.skills,
      experience: body.experience,
      coverLetter: body.coverLetter,
      source: body.source || (isPortalApplication ? "Career Portal" : "Other"),
      workAuthorization: body.workAuthorization,
      hireType: body.hireType || undefined,
      // Visa details — both forms collect these; the client omits visaExpiry
      // when blank, so it stays undefined rather than writing an empty string.
      visaSponsorshipRequired: body.visaSponsorshipRequired || false,
      visaExpiry: body.visaExpiry || undefined,
      ownership: staffOnly(body.ownership, undefined),
      ownershipName: staffOnly(body.ownershipName, undefined),
      createdBy: staffOnly(body.createdBy, undefined),
      createdByName: staffOnly(body.createdByName, undefined),
      rating: staffOnly(body.rating, undefined),
      notes: staffOnly(body.notes, undefined),
      addToTalentBench: staffOnly(body.addToTalentBench || false, false),
      benchAddedBy: staffOnly(body.benchAddedBy, undefined),
      // Bench pool: hired-at-creation records land on the internal bench,
      // everything else added to the bench defaults to the external pool.
      benchType: body.benchType
        || (body.addToTalentBench
          ? (body.status === "hired" ? "internal" : "external")
          : undefined),
      statusHistory: [{
        status: staffOnly(body.status || "pending", "pending"),
        changedAt: now,
        changedBy: body.createdBy || "system",
        changedByName: body.createdByName || (isPortalApplication ? "Career Portal" : "System"),
        notes: "Application created",
      }],
    };

    const result = await createApplication(application);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create application" },
        { status: 500 }
      );
    }

    // Parse the resume automatically once the application is created. after()
    // runs this AFTER the response is sent but keeps the serverless function
    // alive until it finishes, so analysis reliably completes without making the
    // applicant wait. The candidate page also exposes a manual re-analyze action.
    if (application.resumeId) {
      after(async () => {
        try {
          await analyzeApplicationResume(application.id, claims?.sub, { analysis: suppliedAnalysis });
        } catch (err) {
          console.error("Automatic resume analysis failed:", err);
        }
      });
    }

    // Only increment job applications count for portal applications
    if (job && isPortalApplication) {
      const currentCount = job.applicationsCount || 0;
      await updateJob(body.jobId, { applicationsCount: currentCount + 1 });

      /* after(), and AWAITED inside it.
         Both halves matter. Unawaited, this was a promise nobody tracked, and
         on Lambda the execution environment can freeze the moment the response
         returns — so the notification landed sometimes and vanished sometimes.
         after() alone does not fix that: it keeps the invocation alive for the
         promise its callback RETURNS, so a fire-and-forget call inside it is
         just as untracked as it was outside. */
      after(async () => {
        try {
          await createNotification({
            id: uuidv4(),
            type: "application_received",
            title: "New Application Received",
            message: `${name} applied for ${job.title}`,
            link: `/admin/applications`,
            relatedId: application.id,
            isRead: false,
            createdAt: now,
          });
        } catch (err) {
          console.error("Failed to create application notification:", err);
        }
      });

      const emailPromises: Promise<void>[] = [];

      // 1. Send confirmation email to candidate
      emailPromises.push(
        sendApplicationConfirmation({
          candidateName: name,
          candidateEmail: body.email,
          jobTitle: job.title,
          jobDepartment: job.department,
          jobLocation: job.location,
        }).then(() => {}).catch(() => {})
      );

      // 2. Send notifications to recruitment manager and assigned team members
      const notifiedEmails = new Set<string>();

      // 2a. Notify recruitment manager
      if (job.recruitmentManagerEmail) {
        notifiedEmails.add(job.recruitmentManagerEmail.toLowerCase());
        emailPromises.push(
          sendNewApplicationNotification({
            recruiterName: job.recruitmentManagerName || job.recruitmentManagerEmail.split("@")[0],
            recruiterEmail: job.recruitmentManagerEmail,
            candidateName: name,
            candidateEmail: body.email,
            candidatePhone: body.phone,
            jobTitle: job.title,
            jobId: job.id,
            applicationId: application.applicationId || application.id,
            appliedAt: application.appliedAt,
          }).then(() => {}).catch(() => {})
        );
      }

      // 2b. Notify assigned team members
      if (job.assignedToEmails && Array.isArray(job.assignedToEmails) && job.assignedToEmails.length > 0) {
        for (let i = 0; i < job.assignedToEmails.length; i++) {
          const email = job.assignedToEmails[i];
          const recipientName = job.assignedToNames?.[i] || email.split("@")[0];

          // Skip if already notified
          if (email && !notifiedEmails.has(email.toLowerCase())) {
            notifiedEmails.add(email.toLowerCase());
            emailPromises.push(
              sendNewApplicationNotification({
                recruiterName: recipientName,
                recruiterEmail: email,
                candidateName: name,
                candidateEmail: body.email,
                candidatePhone: body.phone,
                jobTitle: job.title,
                jobId: job.id,
                applicationId: application.applicationId || application.id,
                appliedAt: application.appliedAt,
              }).then(() => {}).catch(() => {})
            );
          }
        }
      }

      // Wait for all emails to complete before returning response
      await Promise.all(emailPromises);
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
