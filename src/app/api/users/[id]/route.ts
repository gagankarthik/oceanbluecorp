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
import { serverError } from "@/lib/api-errors";

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
      return serverError("Fetching user", result.error, "That user could not be found.", 404);
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    return serverError("Error fetching user", error, "Couldn't load the user. Please try again.");
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
        return serverError("Updating user role", roleResult.error, "Couldn't change the role. Please try again.");
      }
    }

    // Update status if provided
    if (status) {
      if (status === "active") {
        const enableResult = await enableUser(id);
        if (!enableResult.success) {
          return serverError("Enabling user", enableResult.error, "Couldn't enable the account. Please try again.");
        }
      } else if (status === "inactive") {
        const disableResult = await disableUser(id);
        if (!disableResult.success) {
          return serverError("Disabling user", disableResult.error, "Couldn't disable the account. Please try again.");
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
    return serverError("Error updating user", error, "Couldn't update the user. Please try again.");
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
      return serverError("Deleting user", result.error, "Couldn't delete the user. Please try again.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error deleting user", error, "Couldn't delete the user. Please try again.");
  }
}
