import { NextRequest, NextResponse } from "next/server";
import { getContact, updateContactStatus, deleteContact, Contact } from "@/lib/aws/dynamodb";
import { requireUserAdmin } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

// GET /api/contacts/[id] - Get a single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const result = await getContact(id);

    if (!result.success) {
      return serverError("Fetching contact", result.error, "Couldn't load the message. Please try again.");
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact: result.data });
  } catch (error) {
    return serverError("Error fetching contact", error, "Couldn't load the message. Please try again.");
  }
}

// PATCH /api/contacts/[id] - Update contact status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserAdmin(request);
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
      return serverError("Updating contact", result.error, "Couldn't update the message. Please try again.");
    }

    return NextResponse.json({ message: "Contact updated successfully" });
  } catch (error) {
    return serverError("Error updating contact", error, "Couldn't update the message. Please try again.");
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserAdmin(request);
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
      return serverError("Deleting contact", result.error, "Couldn't delete the message. Please try again.");
    }

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    return serverError("Error deleting contact", error, "Couldn't delete the message. Please try again.");
  }
}
