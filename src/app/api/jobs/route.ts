import { NextRequest, NextResponse, after } from "next/server";
import { getAllJobs, createJob, createNotification, getNextPostingId, Job, toPublicJob } from "@/lib/aws/dynamodb";
import { sendJobPostedNotification } from "@/lib/aws/ses";
import { v4 as uuidv4 } from "uuid";
import { requireJobEditor, getClaims } from "@/lib/auth/verify";
import {
  hasRecruitingAccess, hasJobEditAccess, hasJobCommercialAccess, highestStaffRole,
} from "@/lib/auth/config";
import { sanitizeRichText } from "@/lib/sanitize-server";

// GET /api/jobs - Get all jobs (optionally filter by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Job["status"] | null;

    console.log("API /api/jobs GET - fetching jobs with status:", status || "all");
    const result = await getAllJobs(status || undefined);

    if (!result.success) {
      console.error("API /api/jobs GET - failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // Sort by createdAt descending (newest first)
    const jobs = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Recruiting staff get full records for all statuses. Everyone else, Media
    // and anonymous visitors alike, sees only active/open jobs with the
    // internal fields stripped: drafts, on-hold and closed postings are never
    // exposed outside the recruiting side, and neither are rates, client and
    // vendor names or recruiter assignments.
    //
    // The role test goes through hasRecruitingAccess rather than a literal list
    // of group names. The list it replaces was `["admin","hr","recruiter",
    // "sales"]` compared against the RAW group, which does not match the
    // namespaced `web:admin` this pool writes, so it was one pool migration
    // away from silently serving staff the public projection.
    const claims = await getClaims(request);
    const isStaff = hasRecruitingAccess(claims?.groups);
    // Media authors postings now, so it must see the drafts it is working on —
    // the open-only filter would hide a posting from the person writing it. It
    // still gets the public projection: no rates, client, vendor or assignees.
    // Anonymous visitors keep the old rule exactly.
    const isEditor = hasJobEditAccess(claims?.groups);
    const payload = isStaff
      ? jobs
      : isEditor
        ? jobs.map(toPublicJob)
        : jobs
            .filter((j) => j.status === "active" || j.status === "open")
            .map(toPublicJob);

    console.log("API /api/jobs GET - success, count:", jobs.length);
    return NextResponse.json({ jobs: payload });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("API /api/jobs GET - exception:", errorMessage, error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  const auth = await requireJobEditor(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();

    /* Media may author a posting and may not price one. `commercial` is the
       gate on every field in JOB_COMMERCIAL_FIELDS: for a recruiting caller it
       passes the value through, for media it returns undefined so the field
       never reaches the record. Gating at the assignment, rather than trusting
       the form not to send them, is the point — the form is UX, this is the
       rule (STANDARDS §5.2). */
    const canPrice = hasJobCommercialAccess(auth.claims.groups);
    const commercial = <T,>(value: T): T | undefined => (canPrice ? value : undefined);

    // Validate required fields
    const requiredFields = ["title", "department", "location", "type", "description"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate OB-ID (posting ID)
    const postingIdResult = await getNextPostingId();
    if (!postingIdResult.success || !postingIdResult.postingId) {
      console.error("Failed to generate posting ID:", postingIdResult.error);
      // Continue without posting ID if generation fails
    }

    const job: Job = {
      id: uuidv4(),
      title: body.title,
      department: body.department,
      location: body.location,
      type: body.type,
      description: sanitizeRichText(body.description),
      requirements: typeof body.requirements === "string" ? sanitizeRichText(body.requirements) : (body.requirements || []),
      responsibilities: typeof body.responsibilities === "string" ? sanitizeRichText(body.responsibilities) : (body.responsibilities || []),
      salary: body.salary,
      status: body.status || "draft",
      submissionDueDate: body.submissionDueDate,
      createdAt: new Date().toISOString(),
      // Attribution from the verified token, not the body (STANDARDS §5.1).
      // These were read straight off the request, so the poster's identity and
      // role were whatever the caller typed — harmless while only recruiting
      // staff could reach the route, and not worth keeping now that a role
      // with no recruiting access can.
      createdBy: auth.claims.sub || "system",
      postedByName: body.postedByName,
      postedByEmail: auth.claims.email || body.postedByEmail,
      postedByRole: highestStaffRole(auth.claims.groups) ?? undefined,
      applicationsCount: 0,
      // New fields
      postingId: postingIdResult.postingId,
      state: body.state,
      // Commercial half of the record, recruiting roles only.
      clientId: commercial(body.clientId),
      clientName: commercial(body.clientName),
      clientBillRate: commercial(body.clientBillRate),
      payRate: commercial(body.payRate),
      recruitmentManagerId: commercial(body.recruitmentManagerId),
      recruitmentManagerName: commercial(body.recruitmentManagerName),
      recruitmentManagerEmail: commercial(body.recruitmentManagerEmail),
      // Multi-select assignees
      assignedToIds: commercial(body.assignedToIds) || [],
      assignedToNames: commercial(body.assignedToNames) || [],
      assignedToEmails: commercial(body.assignedToEmails) || [],
      excludedDepartments: commercial(body.excludedDepartments) || [],
    };

    const result = await createJob(job);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create job" },
        { status: 500 }
      );
    }

    /* In-app notification, after the response and awaited inside it.
       Fired unawaited this was a promise nobody held: on Lambda the invocation
       can freeze as soon as the response returns, so the notification appeared
       for some postings and not others with nothing to distinguish them. */
    if (job.status === "active" || job.status === "open") {
      after(async () => {
        try {
          await createNotification({
            id: uuidv4(),
            type: "job_posted",
            title: "New Job Posted",
            message: `${job.title} in ${job.department} - ${job.location}`,
            link: `/admin/jobs`,
            relatedId: job.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to create job notification:", err);
        }
      });
    }

    // Send email notifications for new job posting (only for active/open jobs)
    // Notifications go to: Recruitment Manager + Assigned team members only
    if (job.status === "active" || job.status === "open") {
      const emailRecipients: Array<{ name: string; email: string }> = [];
      const notifiedEmails = new Set<string>();

      // 1. Add job creator (posted by)
      if (job.postedByEmail) {
        emailRecipients.push({
          name: job.postedByName || job.postedByEmail.split("@")[0],
          email: job.postedByEmail,
        });
        notifiedEmails.add(job.postedByEmail.toLowerCase());
      }

      // 2. Add recruitment manager
      if (job.recruitmentManagerEmail && !notifiedEmails.has(job.recruitmentManagerEmail.toLowerCase())) {
        emailRecipients.push({
          name: job.recruitmentManagerName || job.recruitmentManagerEmail.split("@")[0],
          email: job.recruitmentManagerEmail,
        });
        notifiedEmails.add(job.recruitmentManagerEmail.toLowerCase());
      }

      // 3. Add assigned team members (from assignedToEmails array)
      if (job.assignedToEmails && Array.isArray(job.assignedToEmails) && job.assignedToEmails.length > 0) {
        for (let i = 0; i < job.assignedToEmails.length; i++) {
          const email = job.assignedToEmails[i];
          const name = job.assignedToNames?.[i] || email.split("@")[0];
          if (email && !notifiedEmails.has(email.toLowerCase())) {
            emailRecipients.push({ name, email });
            notifiedEmails.add(email.toLowerCase());
          }
        }
      }

      // 4. Add sendEmailNotification recipients (individually selected).
      //    Gated with the rest of the commercial half: this is an arbitrary
      //    list of addresses off the request body, and the picker that fills
      //    it is a team-assignment control media never sees.
      if (canPrice && body.sendEmailNotification && Array.isArray(body.sendEmailNotification)) {
        for (const email of body.sendEmailNotification) {
          if (email && !notifiedEmails.has(email.toLowerCase())) {
            emailRecipients.push({ name: email.split("@")[0], email });
            notifiedEmails.add(email.toLowerCase());
          }
        }
      }

      // Send notifications to all recipients
      if (emailRecipients.length > 0) {
        console.log(`[JOB] Sending job posting notifications to ${emailRecipients.length} recipient(s):`);
        emailRecipients.forEach((r, i) => console.log(`[JOB]   ${i + 1}. ${r.name} <${r.email}>`));

        // Await all email sends to ensure they complete before serverless function terminates
        const emailPromises = emailRecipients.map(async (recipient) => {
          try {
            const result = await sendJobPostedNotification({
              recipientName: recipient.name,
              recipientEmail: recipient.email,
              jobTitle: job.title,
              jobDepartment: job.department,
              jobLocation: job.location,
              jobType: job.type,
              postedByName: job.postedByName || "Admin",
              jobId: job.id,
              postingId: job.postingId,
              description: job.description,
              requirements: job.requirements,
              responsibilities: job.responsibilities,
              salary: job.salary,
              payRate: job.payRate,
              clientBillRate: job.clientBillRate,
              clientName: job.clientName,
              vendorName: job.vendorName,
              submissionDueDate: job.submissionDueDate,
            });
            if (result.success) {
              console.log(`[JOB] Successfully sent job notification to ${recipient.email}`);
            } else {
              console.error(`[JOB] Failed to send job notification to ${recipient.email}:`, result.error);
            }
          } catch (err) {
            console.error(`[JOB] Exception sending job notification to ${recipient.email}:`, err);
          }
        });

        await Promise.all(emailPromises);
      } else {
        console.log("[JOB] No email recipients configured for job posting notification");
      }
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
