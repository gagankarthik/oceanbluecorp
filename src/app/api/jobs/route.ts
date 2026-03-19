import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, createJob, createNotification, getNextPostingId, Job } from "@/lib/aws/dynamodb";
import { sendJobPostedNotification } from "@/lib/aws/ses";
import { v4 as uuidv4 } from "uuid";

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

    console.log("API /api/jobs GET - success, count:", jobs.length);
    return NextResponse.json({ jobs });
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
  try {
    const body = await request.json();

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
      description: body.description,
      requirements: body.requirements || [],
      responsibilities: body.responsibilities || [],
      salary: body.salary,
      status: body.status || "draft",
      submissionDueDate: body.submissionDueDate,
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy || "system",
      postedByName: body.postedByName,
      postedByEmail: body.postedByEmail,
      postedByRole: body.postedByRole,
      applicationsCount: 0,
      // New fields
      postingId: postingIdResult.postingId,
      clientId: body.clientId,
      clientName: body.clientName,
      state: body.state,
      clientBillRate: body.clientBillRate,
      payRate: body.payRate,
      recruitmentManagerId: body.recruitmentManagerId,
      recruitmentManagerName: body.recruitmentManagerName,
      recruitmentManagerEmail: body.recruitmentManagerEmail,
      // Multi-select assignees
      assignedToIds: body.assignedToIds || [],
      assignedToNames: body.assignedToNames || [],
      assignedToEmails: body.assignedToEmails || [],
      excludedDepartments: body.excludedDepartments || [],
    };

    const result = await createJob(job);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create job" },
        { status: 500 }
      );
    }

    // Create in-app notification for admin panel (only for active/open jobs)
    if (job.status === "active" || job.status === "open") {
      createNotification({
        id: uuidv4(),
        type: "job_posted",
        title: "New Job Posted",
        message: `${job.title} in ${job.department} - ${job.location}`,
        link: `/admin/jobs`,
        relatedId: job.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      }).catch((err) => console.error("Failed to create notification:", err));
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

      // 4. Add sendEmailNotification recipients (individually selected)
      if (body.sendEmailNotification && Array.isArray(body.sendEmailNotification)) {
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

        for (const recipient of emailRecipients) {
          sendJobPostedNotification({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            jobTitle: job.title,
            jobDepartment: job.department,
            jobLocation: job.location,
            jobType: job.type,
            postedByName: job.postedByName || "Admin",
            jobId: job.id,
          }).then((result) => {
            if (result.success) {
              console.log(`[JOB] Successfully sent job notification to ${recipient.email}`);
            } else {
              console.error(`[JOB] Failed to send job notification to ${recipient.email}:`, result.error);
            }
          }).catch((err) => console.error(`[JOB] Exception sending job notification to ${recipient.email}:`, err));
        }
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
