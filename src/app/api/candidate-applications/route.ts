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

// GET /api/candidate-applications - Get all candidate applications
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CandidateApplication["status"] | null;

    const result = await getAllCandidateApplications(status || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch candidate applications" },
        { status: 500 }
      );
    }

    // Sort by createdAt descending (newest first)
    const applications = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching candidate applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      console.error("Failed to generate application ID:", err);
      return NextResponse.json(
        { error: "Failed to generate application ID" },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: result.error || "Failed to create candidate application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error creating candidate application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
