import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, createJob, createNotification, getNextPostingId, Job } from "@/lib/aws/dynamodb";
import { sendJobPostingNotificationToHR } from "@/lib/aws/ses";
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
      notifyHROnApplication: body.notifyHROnApplication || false,
      notifyAdminOnApplication: body.notifyAdminOnApplication || false,
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
      assignedToId: body.assignedToId,
      assignedToName: body.assignedToName,
      sendEmailNotification: body.sendEmailNotification || false,
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

    // Send email notification to HR if enabled
    if (job.sendEmailNotification && job.recruitmentManagerEmail) {
      sendJobPostingNotificationToHR(
        {
          title: job.title,
          postingId: job.postingId || job.id,
          clientName: job.clientName || "N/A",
          location: job.location,
          payRate: job.payRate || 0,
          description: job.description,
        },
        [job.recruitmentManagerEmail],
        job.excludedDepartments
      ).catch((err) => console.error("Failed to send HR email notification:", err));
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
