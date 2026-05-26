import { NextRequest, NextResponse } from "next/server";
import { updateCognitoUserAttributes } from "@/lib/aws/cognito";
import { requireStaff } from "@/lib/auth/verify";

// PATCH /api/users/me - Update current user's Cognito profile attributes
export async function PATCH(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { name, phone, userId } = body;

    // We need the user's Cognito username/sub to update their attributes.
    // The caller should pass their Cognito sub (user.id from AuthContext).
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const attributes: { Name: string; Value: string }[] = [];

    if (name !== undefined) {
      attributes.push({ Name: "name", Value: name });
    }

    if (phone !== undefined && phone !== "") {
      attributes.push({ Name: "phone_number", Value: phone });
    }

    if (attributes.length === 0) {
      return NextResponse.json({ success: true, message: "No attributes to update" });
    }

    const result = await updateCognitoUserAttributes(userId, attributes);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
