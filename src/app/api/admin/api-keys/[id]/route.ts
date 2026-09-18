import { NextRequest, NextResponse } from "next/server";
import { updateApiKey, deleteApiKey } from "@/lib/aws/dynamodb";
import { requireAdmin } from "@/lib/auth/verify";
import { isApiAccessLevel, scopesForLevel } from "@/lib/api-scopes";
import { serverError } from "@/lib/api-errors";

// PUT /api/admin/api-keys/[id] - Update name, description, or toggle active
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Parameters<typeof updateApiKey>[1] = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    // Access is changed by level, not by a raw scope list: the caller cannot
    // invent a scope, and cannot grant write without read.
    if (body.accessLevel !== undefined) {
      if (!isApiAccessLevel(body.accessLevel)) {
        return NextResponse.json({ error: "Unknown access level" }, { status: 400 });
      }
      updates.scopes = scopesForLevel(body.accessLevel);
    }

    const result = await updateApiKey(id, updates);
    if (!result.success) {
      return serverError("Updating API key", result.error, "Couldn't update the API key. Please try again.");
    }
    return NextResponse.json({ message: "API key updated" });
  } catch (error) {
    return serverError("Error updating API key", error, "Couldn't update the API key. Please try again.");
  }
}

// DELETE /api/admin/api-keys/[id] - Revoke and delete a key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const result = await deleteApiKey(id);
    if (!result.success) {
      return serverError("Deleting API key", result.error, "Couldn't delete the API key. Please try again.");
    }
    return NextResponse.json({ message: "API key deleted" });
  } catch (error) {
    return serverError("Error deleting API key", error, "Couldn't delete the API key. Please try again.");
  }
}
