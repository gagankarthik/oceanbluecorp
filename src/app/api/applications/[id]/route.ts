import { NextRequest, NextResponse } from "next/server";
import {
  getApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
  Application,
  NoteEntry,
} from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";

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

// PUT /api/applications/[id] - Update application (supports full updates and status changes)
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

    // Validate status if provided
    const validStatuses: Application["status"][] = [
      "pending",
      "reviewing",
      "interview",
      "offered",
      "hired",
      "rejected",
      "active",
      "inactive",
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Handle addNote payload - append to notesHistory array
    if (body.addNote) {
      const { text, addedBy, addedByName } = body.addNote;
      if (!text || !addedBy || !addedByName) {
        return NextResponse.json(
          { error: "addNote requires text, addedBy, and addedByName" },
          { status: 400 }
        );
      }

      // Get existing notes history, or start with empty array
      let notesHistory: NoteEntry[] = existingApp.data.notesHistory || [];

      // Migrate legacy string notes if present and notesHistory is empty
      if (!notesHistory.length && existingApp.data.notes && typeof existingApp.data.notes === "string") {
        notesHistory.push({
          id: "legacy",
          text: existingApp.data.notes,
          addedAt: existingApp.data.appliedAt || existingApp.data.createdAt || new Date().toISOString(),
          addedBy: "system",
          addedByName: "Legacy Note",
        });
      }

      // Add new note
      const newNote: NoteEntry = {
        id: uuidv4(),
        text,
        addedAt: new Date().toISOString(),
        addedBy,
        addedByName,
      };
      notesHistory.push(newNote);

      // Update with new notes history and clear legacy notes field
      const result = await updateApplication(id, {
        notesHistory,
        notes: "", // Clear legacy notes after migration
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to add note" },
          { status: 500 }
        );
      }

      // Fetch updated application
      const updatedApp = await getApplication(id);
      return NextResponse.json({ application: updatedApp.data });
    }

    // Check if this is a status change or a full update
    const isStatusChange = body.status && body.status !== existingApp.data.status;
    const hasFullUpdateFields = body.firstName || body.lastName || body.address ||
      body.city || body.state || body.workAuthorization || body.source ||
      body.ownership || body.skills || body.experience || body.jobId !== undefined ||
      body.resumeId !== undefined || body.resumeFileName !== undefined;

    if (hasFullUpdateFields) {
      // Full application update
      const updates: Partial<Application> = {};

      // Update name fields
      if (body.firstName !== undefined) updates.firstName = body.firstName;
      if (body.lastName !== undefined) updates.lastName = body.lastName;
      if (body.firstName || body.lastName) {
        updates.name = body.name || `${body.firstName || existingApp.data.firstName || ""} ${body.lastName || existingApp.data.lastName || ""}`.trim();
      } else if (body.name !== undefined) {
        updates.name = body.name;
      }

      // Contact info
      if (body.email !== undefined) updates.email = body.email;
      if (body.phone !== undefined) updates.phone = body.phone;

      // Address
      if (body.address !== undefined) updates.address = body.address;
      if (body.city !== undefined) updates.city = body.city;
      if (body.state !== undefined) updates.state = body.state;
      if (body.zipCode !== undefined) updates.zipCode = body.zipCode;

      // Application details
      if (body.status !== undefined) updates.status = body.status;
      if (body.jobId !== undefined) updates.jobId = body.jobId;
      if (body.jobTitle !== undefined) updates.jobTitle = body.jobTitle;
      if (body.source !== undefined) updates.source = body.source;
      if (body.workAuthorization !== undefined) updates.workAuthorization = body.workAuthorization;
      if (body.ownership !== undefined) {
        updates.ownership = body.ownership;
        // Set ownershipClaimedAt when ownership is claimed, clear when released
        if (body.ownership) {
          updates.ownershipClaimedAt = new Date().toISOString();
        } else {
          updates.ownershipClaimedAt = "";
        }
      }
      if (body.ownershipName !== undefined) updates.ownershipName = body.ownershipName;

      // Skills & experience
      if (body.skills !== undefined) updates.skills = body.skills;
      if (body.experience !== undefined) updates.experience = body.experience;
      if (body.coverLetter !== undefined) updates.coverLetter = body.coverLetter;

      // Notes & rating
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.notesHistory !== undefined) updates.notesHistory = body.notesHistory;
      if (body.rating !== undefined) updates.rating = body.rating;

      // Talent bench flag
      if (body.addToTalentBench !== undefined) updates.addToTalentBench = body.addToTalentBench;

      // Resume fields
      if (body.resumeId !== undefined) updates.resumeId = body.resumeId;
      if (body.resumeFileName !== undefined) updates.resumeFileName = body.resumeFileName;

      // Handle status history for status changes
      if (isStatusChange) {
        const statusHistory = existingApp.data.statusHistory || [];
        const newHistoryEntry = {
          status: body.status,
          changedAt: new Date().toISOString(),
          changedBy: body.changedBy,
          changedByName: body.changedByName,
          notes: body.statusNote,
        };
        updates.statusHistory = [...statusHistory, newHistoryEntry];
      }

      const result = await updateApplication(id, updates);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to update application" },
          { status: 500 }
        );
      }
    } else {
      // Simple status/notes/rating update
      const result = await updateApplicationStatus(
        id,
        body.status || existingApp.data.status,
        body.notes,
        body.rating,
        body.changedBy,
        body.changedByName
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to update application" },
          { status: 500 }
        );
      }
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
