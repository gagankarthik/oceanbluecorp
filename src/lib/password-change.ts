// In-app password change: how a Cognito failure becomes something a person can
// act on. Pure, so the mapping is tested without AWS. Raw Cognito text never
// reaches the client; it names internals and reads like a stack trace.
import { strongPassword } from "@/lib/form-validation";

export type PasswordChangeFailure =
  | "wrong-current"
  | "weak"
  | "reused"
  | "same"
  | "throttled"
  | "new-password-required"
  | "mfa-required"
  | "reset-required"
  | "unavailable";

/** Which call failed: verifying the current password, or setting the new one. */
export type PasswordChangeStep = "verify" | "change";

export function classifyPasswordChangeError(
  step: PasswordChangeStep,
  name: string,
  message = "",
): PasswordChangeFailure {
  if (name === "TooManyRequestsException" || name === "LimitExceededException") return "throttled";
  // Cognito's lockout arrives as NotAuthorized, told apart only by its text.
  if (name === "NotAuthorizedException" && /attempts exceeded/i.test(message)) return "throttled";
  if (name === "PasswordResetRequiredException") return "reset-required";
  if (name === "PasswordHistoryPolicyViolationException") return "reused";
  if (name === "InvalidPasswordException") return step === "change" ? "weak" : "unavailable";
  if (name === "InvalidParameterException" && step === "change") return "weak";
  if (name === "NotAuthorizedException" && !/disabled/i.test(message)) return "wrong-current";
  return "unavailable";
}

export interface PasswordChangeResponse {
  status: number;
  error: string;
  /** Form field the message belongs next to, when there is one. */
  field?: "currentPassword" | "newPassword";
}

const POLICY =
  "Use at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol, and no space at either end.";

export function passwordChangeResponse(reason: PasswordChangeFailure, newPassword = ""): PasswordChangeResponse {
  switch (reason) {
    case "wrong-current":
      return { status: 400, field: "currentPassword", error: "Your current password is incorrect." };
    case "weak":
      return { status: 400, field: "newPassword", error: strongPassword()(newPassword) ?? `That password doesn't meet the policy. ${POLICY}` };
    case "reused":
      return { status: 400, field: "newPassword", error: "You've used that password before. Choose a new one." };
    case "same":
      return { status: 400, field: "newPassword", error: "Choose a password different from your current one." };
    case "throttled":
      return { status: 429, error: "Too many attempts. Try again in a few minutes." };
    case "new-password-required":
      return { status: 409, error: "Your account setup isn't finished. Sign out, sign back in, and set your password there." };
    case "mfa-required":
      return { status: 409, error: "Your account needs a verification step this form can't complete. Use \"Forgot password\" on the sign-in page instead." };
    case "reset-required":
      return { status: 409, error: "Your password has to be reset first. Use \"Forgot password\" on the sign-in page." };
    case "unavailable":
    default:
      return { status: 500, error: "Couldn't change your password. Please try again." };
  }
}
