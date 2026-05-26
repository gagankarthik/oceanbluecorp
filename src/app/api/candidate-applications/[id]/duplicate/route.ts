import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateApplication,
  createCandidateApplication,
  getNextApplicationId,
  CandidateApplication,
} from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { requireStaff } from "@/lib/auth/verify";

// POST /api/candidate-applications/[id]/duplicate - Duplicate a candidate application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Get the original application
    const originalApp = await getCandidateApplication(id);
    if (!originalApp.success || !originalApp.data) {
      return NextResponse.json(
        { error: "Candidate application not found" },
        { status: 404 }
      );
    }

    // Generate new application ID (APP-YEAR-XXXX format)
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

    const body = await request.json().catch(() => ({}));

    // Create duplicate
    const duplicateApp: CandidateApplication = {
      ...originalApp.data,
      id: uuidv4(),
      applicationId,
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy || originalApp.data.createdBy,
      createdByName: body.createdByName || originalApp.data.createdByName,
      updatedAt: undefined,
    };

    const result = await createCandidateApplication(duplicateApp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to duplicate candidate application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ application: duplicateApp }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating candidate application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
