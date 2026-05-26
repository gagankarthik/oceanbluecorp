import { NextRequest, NextResponse } from "next/server";
import { inviteUser, STAFF_ROLES, type StaffRole } from "@/lib/aws/cognito";
import { requireAdmin } from "@/lib/auth/verify";

const cognitoErrorMessages: Record<string, string> = {
  UsernameExistsException: "An account with this email already exists.",
  InvalidParameterException: "Please enter a valid email address.",
  TooManyRequestsException: "Too many attempts. Please try again later.",
};

// POST /api/users/invite - Invite a new staff member (email + role).
// Cognito emails the invitation with a temporary password.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required." },
        { status: 400 }
      );
    }

    if (!STAFF_ROLES.includes(role as StaffRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${STAFF_ROLES.join(", ")}.` },
        { status: 400 }
      );
    }

    const result = await inviteUser(email.trim().toLowerCase(), role as StaffRole);

    if (!result.success) {
      // Surface a friendly message for known Cognito errors.
      const friendly = Object.entries(cognitoErrorMessages).find(([code]) =>
        (result.error || "").includes(code)
      )?.[1];
      return NextResponse.json(
        { error: friendly || result.error || "Failed to send invite." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
