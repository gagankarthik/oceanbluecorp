import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";

const cognitoErrorMessages: Record<string, string> = {
  NotAuthorizedException: "Incorrect email or password.",
  UserNotFoundException: "No account found with this email.",
  UserNotConfirmedException: "Please verify your email before signing in.",
  PasswordResetRequiredException: "You must reset your password before signing in.",
  TooManyRequestsException: "Too many attempts. Please try again later.",
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);

    // First sign-in for an invited user: Cognito requires a permanent password
    // before issuing tokens. Hand the session back so the client can collect a
    // new password (plus name + phone) and complete the challenge.
    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      return NextResponse.json({
        challenge: "NEW_PASSWORD_REQUIRED",
        session: response.Session,
      });
    }

    const result = response.AuthenticationResult;

    if (!result?.AccessToken || !result?.IdToken) {
      return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
    }

    return NextResponse.json({
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn ?? 3600,
    });
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? "";
    const message = cognitoErrorMessages[name] ?? "Sign in failed. Please try again.";
    const status = name === "NotAuthorizedException" || name === "UserNotFoundException" ? 401 : 400;
    return NextResponse.json({ error: message, code: name }, { status });
  }
}
