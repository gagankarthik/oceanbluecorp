import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateApplication,
  updateCandidateApplication,
  deleteCandidateApplication,
  CandidateApplication,
  getJob,
} from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/candidate-applications/[id] - Get a specific candidate application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    const result = await getCandidateApplication(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch candidate application" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Candidate application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: result.data });
  } catch (error) {
    console.error("Error fetching candidate application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/candidate-applications/[id] - Update a candidate application
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
    const existingApp = await getCandidateApplication(id);
    if (!existingApp.success || !existingApp.data) {
      return NextResponse.json(
        { error: "Candidate application not found" },
        { status: 404 }
      );
    }

    // Validate status if provided
    const validStatuses: CandidateApplication["status"][] = [
      "active",
      "inactive",
      "hired",
      "rejected",
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get job title if jobId is provided and changed
    let jobTitle = body.jobTitle;
    if (body.jobId && body.jobId !== existingApp.data.jobId) {
      const jobResult = await getJob(body.jobId);
      if (jobResult.success && jobResult.data) {
        jobTitle = jobResult.data.title;
      }
    }

    const updates: Partial<CandidateApplication> = {};

    // Only include fields that are provided in the body
    if (body.firstName !== undefined) updates.firstName = body.firstName;
    if (body.lastName !== undefined) updates.lastName = body.lastName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    if (body.address !== undefined) updates.address = body.address;
    if (body.city !== undefined) updates.city = body.city;
    if (body.state !== undefined) updates.state = body.state;
    if (body.zipCode !== undefined) updates.zipCode = body.zipCode;
    if (body.source !== undefined) updates.source = body.source;
    if (body.status !== undefined) updates.status = body.status;
    if (body.jobId !== undefined) updates.jobId = body.jobId;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (body.ownership !== undefined) updates.ownership = body.ownership;
    if (body.ownershipName !== undefined) updates.ownershipName = body.ownershipName;
    if (body.workAuthorization !== undefined) updates.workAuthorization = body.workAuthorization;
    if (body.rating !== undefined) updates.rating = body.rating;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.addToTalentBench !== undefined) updates.addToTalentBench = body.addToTalentBench;

    const result = await updateCandidateApplication(id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update candidate application" },
        { status: 500 }
      );
    }

    // Fetch updated application
    const updatedApp = await getCandidateApplication(id);

    return NextResponse.json({ application: updatedApp.data });
  } catch (error) {
    console.error("Error updating candidate application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/candidate-applications/[id] - Delete a candidate application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Check if application exists
    const existingApp = await getCandidateApplication(id);
    if (!existingApp.success || !existingApp.data) {
      return NextResponse.json(
        { error: "Candidate application not found" },
        { status: 404 }
      );
    }

    const result = await deleteCandidateApplication(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete candidate application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Candidate application deleted successfully" });
  } catch (error) {
    console.error("Error deleting candidate application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
