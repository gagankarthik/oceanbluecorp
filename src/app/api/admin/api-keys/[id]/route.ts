import { NextRequest, NextResponse } from "next/server";
import { updateApiKey, deleteApiKey } from "@/lib/aws/dynamodb";

// PUT /api/admin/api-keys/[id] - Update name, description, or toggle active
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Parameters<typeof updateApiKey>[1] = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const result = await updateApiKey(id, updates);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update API key" }, { status: 500 });
    }
    return NextResponse.json({ message: "API key updated" });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/api-keys/[id] - Revoke and delete a key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteApiKey(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete API key" }, { status: 500 });
    }
    return NextResponse.json({ message: "API key deleted" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
