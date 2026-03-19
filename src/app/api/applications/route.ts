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
  getNextApplicationId,
} from "@/lib/aws/dynamodb";
import {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
} from "@/lib/aws/ses";
import { v4 as uuidv4 } from "uuid";

// GET /api/applications - Get applications (with optional filters)
export async function GET(request: NextRequest) {
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

    // Sort by appliedAt descending (newest first)
    applications.sort(
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

// POST /api/applications - Create a new application (supports both portal and HR-created)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
      status: body.status || "pending",
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
      ownership: body.ownership,
      ownershipName: body.ownershipName,
      createdBy: body.createdBy,
      createdByName: body.createdByName,
      rating: body.rating,
      notes: body.notes,
      addToTalentBench: body.addToTalentBench || false,
      statusHistory: [{
        status: body.status || "pending",
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

    // Only increment job applications count for portal applications
    if (job && isPortalApplication) {
      const currentCount = job.applicationsCount || 0;
      await updateJob(body.jobId, { applicationsCount: currentCount + 1 });

      // Create in-app notification for admin panel
      createNotification({
        id: uuidv4(),
        type: "application_received",
        title: "New Application Received",
        message: `${name} applied for ${job.title}`,
        link: `/admin/applications`,
        relatedId: application.id,
        isRead: false,
        createdAt: now,
      }).catch((err) => console.error("Failed to create notification:", err));

      // Send email notifications - must await to ensure completion before serverless function terminates
      console.log("[APPLICATION] Sending email notifications for new application...");
      console.log(`[APPLICATION] Candidate: ${name} (${body.email})`);
      console.log(`[APPLICATION] Job: ${job.title}`);
      console.log(`[APPLICATION] Recruitment Manager: ${job.recruitmentManagerEmail || 'Not set'}`);
      console.log(`[APPLICATION] Assigned Team: ${job.assignedToEmails?.join(', ') || 'None'}`);

      const emailPromises: Promise<void>[] = [];

      // 1. Send confirmation email to candidate
      emailPromises.push(
        sendApplicationConfirmation({
          candidateName: name,
          candidateEmail: body.email,
          jobTitle: job.title,
          jobDepartment: job.department,
          jobLocation: job.location,
        }).then((result) => {
          if (result.success) {
            console.log(`[APPLICATION] Candidate confirmation email sent successfully to ${body.email}`);
          } else {
            console.error(`[APPLICATION] Failed to send candidate confirmation to ${body.email}:`, result.error);
          }
        }).catch((err) => console.error("[APPLICATION] Exception sending candidate confirmation:", err))
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
          }).then((result) => {
            if (result.success) {
              console.log(`[APPLICATION] Notification sent to recruitment manager: ${job.recruitmentManagerEmail}`);
            } else {
              console.error(`[APPLICATION] Failed to notify recruitment manager ${job.recruitmentManagerEmail}:`, result.error);
            }
          }).catch((err) => console.error("[APPLICATION] Exception notifying recruitment manager:", err))
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
              }).then((result) => {
                if (result.success) {
                  console.log(`[APPLICATION] Notification sent to team member: ${email}`);
                } else {
                  console.error(`[APPLICATION] Failed to notify team member ${email}:`, result.error);
                }
              }).catch((err) => console.error(`[APPLICATION] Exception notifying ${email}:`, err))
            );
          }
        }
      }

      // Wait for all emails to complete before returning response
      await Promise.all(emailPromises);
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
