import { NextRequest, NextResponse } from "next/server";
import { changeOwnPassword, getCognitoUser } from "@/lib/aws/cognito";
import { requireSignedIn } from "@/lib/auth/verify";
import { validate, validationMessage, type Schema } from "@/lib/validate";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { passwordChangeResponse, type PasswordChangeFailure } from "@/lib/password-change";
import { passwordNeeds } from "@/lib/form-validation";
import { serverError } from "@/lib/api-errors";

// Cognito's own ceiling. Passwords are never trimmed: a space is a character.
const PASSWORD_SCHEMA: Schema = {
  currentPassword: { kind: "string", required: true, maxLength: 256, trim: false },
  newPassword: { kind: "string", required: true, maxLength: 256, trim: false },
};

const fail = (reason: PasswordChangeFailure, newPassword?: string) => {
  const { status, ...body } = passwordChangeResponse(reason, newPassword);
  return NextResponse.json(body, { status });
};

// POST /api/users/me/password - change the caller's own password.
export async function POST(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  try {
    const raw = await request.json().catch(() => null);
    const checked = validate<{ currentPassword: string; newPassword: string }>(raw, PASSWORD_SCHEMA);
    if (!checked.ok) {
      return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    }
    const { currentPassword, newPassword } = checked.value;

    // Settled here so a policy miss never spends a Cognito sign-in attempt.
    if (passwordNeeds(newPassword).length > 0) return fail("weak", newPassword);
    if (newPassword === currentPassword) return fail("same");

    // Counted after validation: only attempts that reach Cognito are guesses.
    const limited = await checkRateLimit(request, RATE_LIMITS.passwordChange, `user:${auth.claims.sub}`);
    if (!limited.allowed) return limited.response!;

    // ID tokens carry email; an access-token caller does not, so look it up.
    const username = auth.claims.email || (await getCognitoUser(auth.claims.sub)).user?.email;
    if (!username) {
      return serverError("Password change: no email for caller", auth.claims.sub, passwordChangeResponse("unavailable").error);
    }

    const result = await changeOwnPassword({
      username,
      expectedSub: auth.claims.sub,
      currentPassword,
      newPassword,
    });
    if (!result.success) return fail(result.reason ?? "unavailable", newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Password change", error, passwordChangeResponse("unavailable").error);
  }
}
