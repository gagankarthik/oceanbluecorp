import { NextRequest, NextResponse } from "next/server";
import {
  getAllCandidateApplications,
  createCandidateApplication,
  getNextApplicationId,
  CandidateApplication,
  getJob,
} from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

// GET /api/candidate-applications - Get all candidate applications
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CandidateApplication["status"] | null;

    const result = await getAllCandidateApplications(status || undefined);

    if (!result.success) {
      return serverError("Fetching candidate applications", result.error, "Couldn't load the candidate applications. Please try again.");
    }

    // Sort by createdAt descending (newest first)
    const applications = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ applications });
  } catch (error) {
    return serverError("Error fetching candidate applications", error, "Couldn't load the candidate applications. Please try again.");
  }
}

// POST /api/candidate-applications - Create a new candidate application
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "phone", "email", "source", "status", "workAuthorization"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate application ID (APP-YEAR-XXXX format)
    let applicationId: string;
    try {
      applicationId = await getNextApplicationId();
    } catch (err) {
      return serverError("Failed to generate application ID", err, "Couldn't create the candidate application. Please try again.");
    }

    // Get job title if jobId is provided
    let jobTitle = body.jobTitle;
    if (body.jobId && !jobTitle) {
      const jobResult = await getJob(body.jobId);
      if (jobResult.success && jobResult.data) {
        jobTitle = jobResult.data.title;
      }
    }

    const now = new Date().toISOString();
    const fullName = `${body.firstName} ${body.lastName}`.trim();

    const application: CandidateApplication = {
      id: uuidv4(),
      applicationId,
      name: fullName, // Combined name for compatibility
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      source: body.source,
      status: body.status,
      jobId: body.jobId,
      jobTitle: jobTitle,
      ownership: body.ownership,
      ownershipName: body.ownershipName,
      workAuthorization: body.workAuthorization,
      createdBy: body.createdBy || "system",
      createdByName: body.createdByName,
      createdAt: now,
      appliedAt: now, // Same as createdAt for compatibility
      rating: body.rating,
      notes: body.notes,
      addToTalentBench: body.addToTalentBench || false,
    };

    const result = await createCandidateApplication(application);

    if (!result.success) {
      return serverError("Creating candidate application", result.error, "Couldn't create the candidate application. Please try again.");
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return serverError("Error creating candidate application", error, "Couldn't create the candidate application. Please try again.");
  }
}
