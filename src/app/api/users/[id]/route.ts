import { NextRequest, NextResponse } from "next/server";
import {
  getCognitoUser,
  updateUserRole,
  enableUser,
  disableUser,
  deleteUser,
  STAFF_ROLES,
  type StaffRole,
} from "@/lib/aws/cognito";
import { requireStaff, requireUserAdmin, denyElevatedAction } from "@/lib/auth/verify";

// GET /api/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
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
//
// Admin and HR both manage accounts; HR is held to ordinary staff. The target's
// current role is read from Cognito rather than taken from the request, so a
// caller cannot talk their way past the check.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status } = body;

    const current = await getCognitoUser(id);
    const guard = denyElevatedAction(auth.claims, {
      grantingRole: role,
      targetRole: current.user?.role ?? null,
    });
    if (guard) return guard;

    // Update role if provided
    if (role) {
      if (!STAFF_ROLES.includes(role as StaffRole)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${STAFF_ROLES.join(", ")}.` },
          { status: 400 }
        );
      }

      const roleResult = await updateUserRole(id, role as StaffRole);
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

// DELETE /api/users/[id] - Delete a user. HR may remove ordinary staff; only an
// admin can delete an Admin or HR account.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    const current = await getCognitoUser(id);
    const guard = denyElevatedAction(auth.claims, { targetRole: current.user?.role ?? null });
    if (guard) return guard;

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
