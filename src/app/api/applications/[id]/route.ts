import { NextRequest, NextResponse } from "next/server";
import {
  getApplication,
  updateApplicationStatus,
  deleteApplication,
  Application,
} from "@/lib/aws/dynamodb";

// GET /api/applications/[id] - Get a specific application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await getApplication(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch application" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: result.data });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/applications/[id] - Update application status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if application exists
    const existingApp = await getApplication(id);
    if (!existingApp.success || !existingApp.data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Validate status
    const validStatuses: Application["status"][] = [
      "pending",
      "reviewing",
      "interview",
      "offered",
      "hired",
      "rejected",
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const result = await updateApplicationStatus(
      id,
      body.status || existingApp.data.status,
      body.notes,
      body.rating
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update application" },
        { status: 500 }
      );
    }

    // Fetch updated application
    const updatedApp = await getApplication(id);

    return NextResponse.json({ application: updatedApp.data });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete an application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if application exists
    const existingApp = await getApplication(id);
    if (!existingApp.success || !existingApp.data) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const result = await deleteApplication(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
