import { isUrl, normalizeWebsite } from "@/lib/form-validation";
import { NextRequest, NextResponse } from "next/server";
import { getClient, updateClient, deleteClient, Client } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

// GET /api/clients/[id] - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const result = await getClient(id);

    if (!result.success) {
      return serverError("Fetching client", result.error, "Couldn't load the client. Please try again.");
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ client: result.data });
  } catch (error) {
    return serverError("Error fetching client", error, "Couldn't load the client. Please try again.");
  }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if client exists
    const existingClient = await getClient(id);
    if (!existingClient.success || !existingClient.data) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status && !["active", "inactive"].includes(body.status)) {
      return NextResponse.json(
        { error: "Status must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Validate website URL format if provided
    if (body.websiteUrl) {
      body.websiteUrl = normalizeWebsite(String(body.websiteUrl));
      if (!isUrl(body.websiteUrl)) {
        return NextResponse.json(
          { error: "Invalid website URL format" },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    const updates: Partial<Omit<Client, "id" | "createdAt">> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.websiteUrl !== undefined) updates.websiteUrl = body.websiteUrl.trim();
    if (body.status !== undefined) updates.status = body.status;
    // "" clears a field; the update skips undefined, so it would keep the old value.
    if (body.email !== undefined) updates.email = body.email?.trim() ?? "";
    if (body.phone !== undefined) updates.phone = body.phone?.trim() ?? "";
    if (body.address !== undefined) updates.address = body.address?.trim() ?? "";
    if (body.city !== undefined) updates.city = body.city?.trim() ?? "";
    if (body.state !== undefined) updates.state = body.state?.trim() ?? "";
    if (body.zipCode !== undefined) updates.zipCode = body.zipCode?.trim() ?? "";

    const result = await updateClient(id, updates);

    if (!result.success) {
      return serverError("Updating client", result.error, "Couldn't save the client. Please try again.");
    }

    return NextResponse.json({ message: "Client updated successfully" });
  } catch (error) {
    return serverError("Error updating client", error, "Couldn't save the client. Please try again.");
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Check if client exists
    const existingClient = await getClient(id);
    if (!existingClient.success || !existingClient.data) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const result = await deleteClient(id);

    if (!result.success) {
      return serverError("Deleting client", result.error, "Couldn't delete the client. Please try again.");
    }

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    return serverError("Error deleting client", error, "Couldn't delete the client. Please try again.");
  }
}
