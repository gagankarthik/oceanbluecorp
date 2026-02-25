import { NextRequest, NextResponse } from "next/server";
import {
  getAllApplications,
  getApplicationsByJob,
  getApplicationsByUser,
  createApplication,
  createNotification,
  Application,
  getJob,
  updateJob,
} from "@/lib/aws/dynamodb";
import {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
} from "@/lib/aws/ses";
import { listCognitoUsers } from "@/lib/aws/cognito";
import { v4 as uuidv4 } from "uuid";

// GET /api/applications - Get applications (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    let result;

    if (userId) {
      result = await getApplicationsByUser(userId);
    } else if (jobId) {
      result = await getApplicationsByJob(jobId);
    } else {
      result = await getAllApplications();
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch applications" },
        { status: 500 }
      );
    }

    // Sort by appliedAt descending (newest first)
    const applications = (result.data || []).sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create a new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["jobId", "name", "email"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if job exists and is active
    const jobResult = await getJob(body.jobId);
    if (!jobResult.success || !jobResult.data) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (jobResult.data.status !== "active") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    const application: Application = {
      id: uuidv4(),
      userId: body.userId || "anonymous",
      jobId: body.jobId,
      resumeId: body.resumeId || "",
      status: "pending",
      appliedAt: new Date().toISOString(),
      name: body.name,
      email: body.email,
      phone: body.phone,
      skills: body.skills,
      experience: body.experience,
      coverLetter: body.coverLetter,
    };

    const result = await createApplication(application);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create application" },
        { status: 500 }
      );
    }

    // Increment applications count on the job
    const currentCount = jobResult.data.applicationsCount || 0;
    await updateJob(body.jobId, { applicationsCount: currentCount + 1 });

    const job = jobResult.data;

    // Create in-app notification for admin panel
    createNotification({
      id: uuidv4(),
      type: "application_received",
      title: "New Application Received",
      message: `${body.name} applied for ${job.title}`,
      link: `/admin/applications`,
      relatedId: application.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    }).catch((err) => console.error("Failed to create notification:", err));

    // Send email notifications (don't block the response)
    // 1. Send confirmation email to candidate
    sendApplicationConfirmation({
      candidateName: body.name,
      candidateEmail: body.email,
      jobTitle: job.title,
      jobDepartment: job.department,
      jobLocation: job.location,
    }).catch((err) => console.error("Failed to send candidate confirmation:", err));

    // 2. Send notification to recruiter who posted the job
    if (job.postedByEmail && job.postedByName) {
      sendNewApplicationNotification({
        recruiterName: job.postedByName,
        recruiterEmail: job.postedByEmail,
        candidateName: body.name,
        candidateEmail: body.email,
        candidatePhone: body.phone,
        jobTitle: job.title,
        jobId: job.id,
        applicationId: application.id,
        appliedAt: application.appliedAt,
      }).catch((err) => console.error("Failed to send recruiter notification:", err));
    }

    // 3. Send notifications to HR/Admin users if configured
    if (job.notifyHROnApplication || job.notifyAdminOnApplication) {
      listCognitoUsers()
        .then((usersResult) => {
          if (!usersResult.success || !usersResult.users) return;

          const recipients = usersResult.users.filter((user) => {
            const groups = user.groups || [];
            if (job.notifyHROnApplication && groups.includes("hr")) return true;
            if (job.notifyAdminOnApplication && groups.includes("admin")) return true;
            return false;
          });

          // Send email to each HR/Admin (excluding the job poster who already got notified)
          for (const recipient of recipients) {
            if (recipient.email === job.postedByEmail) continue;

            sendNewApplicationNotification({
              recruiterName: recipient.name || recipient.email.split("@")[0],
              recruiterEmail: recipient.email,
              candidateName: body.name,
              candidateEmail: body.email,
              candidatePhone: body.phone,
              jobTitle: job.title,
              jobId: job.id,
              applicationId: application.id,
              appliedAt: application.appliedAt,
            }).catch((err) => console.error(`Failed to send notification to ${recipient.email}:`, err));
          }
        })
        .catch((err) => console.error("Failed to fetch users for notifications:", err));
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
