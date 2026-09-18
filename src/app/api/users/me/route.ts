import { NextRequest, NextResponse } from "next/server";
import { updateCognitoUserAttributes } from "@/lib/aws/cognito";
import { requireSignedIn } from "@/lib/auth/verify";
import { validate, validationMessage, type Schema } from "@/lib/validate";
import { serverError } from "@/lib/api-errors";

const PROFILE_SCHEMA: Schema = {
  name: { kind: "string", maxLength: 200 },
  phone: { kind: "string", maxLength: 20 },
};

// PATCH /api/users/me - Update current user's Cognito profile attributes
export async function PATCH(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  try {
    const raw = await request.json().catch(() => null);

    // Passwords change at /api/users/me/password. A stale client posting one
    // here must not get a 200 for a password that was never changed.
    if (raw && typeof raw === "object" && "newPassword" in raw) {
      return NextResponse.json(
        { error: "Password changes have moved. Reload the page and try again from Settings, Security." },
        { status: 400 },
      );
    }

    const checked = validate<{ name?: string; phone?: string }>(raw, PROFILE_SCHEMA);
    if (!checked.ok) {
      return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    }
    const { name, phone } = checked.value;

    const attributes: { Name: string; Value: string }[] = [];
    if (name !== undefined) attributes.push({ Name: "name", Value: name });
    if (phone !== undefined) attributes.push({ Name: "phone_number", Value: phone });

    if (attributes.length === 0) {
      return NextResponse.json({ success: true, message: "No attributes to update" });
    }

    // The target is the verified caller, never a `userId` off the body: this
    // runs with admin credentials, so taking the id from the client let any
    // signed-in account rewrite anyone's name and phone number.
    const result = await updateCognitoUserAttributes(auth.claims.sub, attributes);

    if (!result.success) {
      if (/phone/i.test(result.error || "")) {
        return NextResponse.json(
          { error: "Enter the phone number in international format, e.g. +16145551234." },
          { status: 400 },
        );
      }
      return serverError("Updating user profile", result.error, "Couldn't save your profile. Please try again.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error updating user profile", error, "Couldn't save your profile. Please try again.");
  }
}
