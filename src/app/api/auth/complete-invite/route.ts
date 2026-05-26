import {
  CognitoIdentityProviderClient,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";
import { updateCognitoUserAttributes } from "@/lib/aws/cognito";

const cognitoErrorMessages: Record<string, string> = {
  InvalidPasswordException:
    "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
  NotAuthorizedException: "Your invite session has expired. Please sign in again to restart.",
  CodeMismatchException: "Your invite session is no longer valid. Please sign in again.",
  ExpiredCodeException: "Your invite session has expired. Please sign in again to restart.",
  InvalidParameterException: "Please check your details and try again.",
  TooManyRequestsException: "Too many attempts. Please try again later.",
};

// POST /api/auth/complete-invite
// Answers the Cognito NEW_PASSWORD_REQUIRED challenge raised on an invited
// user's first sign-in: sets the permanent password, then stores their full
// name and phone number on the account.
export async function POST(request: Request) {
  try {
    const { email, session, name, phone, password } = await request.json();

    if (!email || !session || !name || !phone || !password) {
      return NextResponse.json(
        { error: "Name, phone, and a new password are required." },
        { status: 400 }
      );
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    const response = await client.send(
      new RespondToAuthChallengeCommand({
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: password,
        },
      })
    );

    const result = response.AuthenticationResult;

    if (!result?.AccessToken || !result?.IdToken) {
      return NextResponse.json(
        { error: "Could not complete your account setup. Please sign in again." },
        { status: 400 }
      );
    }

    // Resolve the account's `sub` from the freshly issued IdToken — a reliable
    // identifier for the admin attribute update regardless of how the pool maps
    // usernames vs. the email alias.
    let usernameForUpdate = email;
    try {
      const payload = JSON.parse(
        Buffer.from(result.IdToken.split(".")[1], "base64").toString("utf8")
      );
      if (payload?.sub) usernameForUpdate = payload.sub;
    } catch {
      // Fall back to email if the token can't be decoded.
    }

    // Persist name + phone now that the account is active. Uses admin
    // credentials (server-side) so it works regardless of token scope. A
    // failure here shouldn't block the user from getting in — log and continue.
    const attrResult = await updateCognitoUserAttributes(usernameForUpdate, [
      { Name: "name", Value: name },
      { Name: "phone_number", Value: phone },
    ]);
    if (!attrResult.success) {
      console.error("Failed to set name/phone after invite completion:", attrResult.error);
    }

    return NextResponse.json({
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn ?? 3600,
    });
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? "";
    const message = cognitoErrorMessages[name] ?? "Could not complete your account setup. Please try again.";
    return NextResponse.json({ error: message, code: name }, { status: 400 });
  }
}
