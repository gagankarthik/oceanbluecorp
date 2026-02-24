import { NextRequest, NextResponse } from "next/server";
import {
  getCognitoUser,
  updateUserRole,
  enableUser,
  disableUser,
  deleteUser,
} from "@/lib/aws/cognito";

// GET /api/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await getCognitoUser(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user (role, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status } = body;

    // Update role if provided
    if (role) {
      const validRoles = ["admin", "hr", "user"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be 'admin', 'hr', or 'user'" },
          { status: 400 }
        );
      }

      const roleResult = await updateUserRole(id, role);
      if (!roleResult.success) {
        return NextResponse.json(
          { error: roleResult.error || "Failed to update role" },
          { status: 500 }
        );
      }
    }

    // Update status if provided
    if (status) {
      if (status === "active") {
        const enableResult = await enableUser(id);
        if (!enableResult.success) {
          return NextResponse.json(
            { error: enableResult.error || "Failed to enable user" },
            { status: 500 }
          );
        }
      } else if (status === "inactive") {
        const disableResult = await disableUser(id);
        if (!disableResult.success) {
          return NextResponse.json(
            { error: disableResult.error || "Failed to disable user" },
            { status: 500 }
          );
        }
      }
    }

    // Get updated user
    const userResult = await getCognitoUser(id);

    return NextResponse.json({
      success: true,
      user: userResult.user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await deleteUser(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
