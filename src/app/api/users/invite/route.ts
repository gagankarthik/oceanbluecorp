import { NextRequest, NextResponse } from "next/server";
import { inviteUser, STAFF_ROLES, type StaffRole } from "@/lib/aws/cognito";
import { requireUserAdmin, denyElevatedAction } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

const cognitoErrorMessages: Record<string, string> = {
  UsernameExistsException: "An account with this email already exists.",
  InvalidParameterException: "Please enter a valid email address.",
  TooManyRequestsException: "Too many attempts. Please try again later.",
};

// POST /api/users/invite - Invite a new staff member (email + role).
// Cognito emails the invitation with a temporary password.
//
// Admin and HR both invite; only an admin may hand out Admin or HR itself.
export async function POST(request: NextRequest) {
  const auth = await requireUserAdmin(request);
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

    const escalation = denyElevatedAction(auth.claims, { grantingRole: role });
    if (escalation) return escalation;

    const result = await inviteUser(email.trim().toLowerCase(), role as StaffRole);

    if (!result.success) {
      // Matched on the SDK error name: the old test looked for the code inside
      // the message text, which never contains it, so this never fired.
      const friendly = result.code ? cognitoErrorMessages[result.code] : undefined;
      if (friendly) return NextResponse.json({ error: friendly }, { status: 400 });
      return serverError("Inviting user", result.error, "Couldn't send the invite. Please try again.", 400);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error inviting user", error, "Couldn't send the invite. Please try again.");
  }
}
