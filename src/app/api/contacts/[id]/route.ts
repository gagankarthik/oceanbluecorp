import { NextRequest, NextResponse } from "next/server";
import { getContact, updateContactStatus, deleteContact, Contact } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/contacts/[id] - Get a single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const result = await getContact(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch contact" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact: result.data });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/[id] - Update contact status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate status
    const validStatuses: Contact["status"][] = ["new", "read", "responded", "archived"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Check if contact exists
    const existingContact = await getContact(id);
    if (!existingContact.success || !existingContact.data) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const result = await updateContactStatus(id, body.status, body.notes);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Contact updated successfully" });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Check if contact exists
    const existingContact = await getContact(id);
    if (!existingContact.success || !existingContact.data) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const result = await deleteContact(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
