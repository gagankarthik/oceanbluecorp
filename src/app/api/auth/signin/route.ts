import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const cognitoErrorMessages: Record<string, string> = {
  NotAuthorizedException: "Incorrect email or password.",
  // Same words as a wrong password: a distinct answer lets anyone enumerate
  // staff emails (forgot-password already refuses to, for the same reason).
  UserNotFoundException: "Incorrect email or password.",
  UserNotConfirmedException: "Please verify your email before signing in.",
  PasswordResetRequiredException: "You must reset your password before signing in.",
  TooManyRequestsException: "Too many attempts. Please try again later.",
};

export async function POST(request: Request) {
  const limited = await checkRateLimit(request, RATE_LIMITS.signIn);
  if (!limited.allowed) return limited.response!;

  try {
    const { email, password } = await request.json();

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (email.length > 254 || password.length > 256) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
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
      const params = response.ChallengeParameters ?? {};

      // Any attribute the pool marks required but the invite didn't set has to
      // travel with the challenge answer. Cognito lists them here as
      // ["userAttributes.name","userAttributes.phone_number"], strip the prefix
      // (singular too, the API has used both spellings).
      let requiredAttributes: string[] = [];
      try {
        const raw = JSON.parse(params.requiredAttributes || "[]");
        if (Array.isArray(raw)) {
          requiredAttributes = raw.map((a: string) => String(a).replace(/^userAttributes?\./, ""));
        }
      } catch {
        // Malformed list, the complete-invite route falls back to its defaults.
      }

      return NextResponse.json({
        challenge: "NEW_PASSWORD_REQUIRED",
        session: response.Session,
        // Answer the challenge with the identifier Cognito issued the session
        // for. Pools that use a UUID username with email as an alias reject the
        // typed email here.
        username: params.USER_ID_FOR_SRP || email,
        requiredAttributes,
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
    if (!cognitoErrorMessages[name]) console.error("[oceanblue] sign-in failed:", err);
    // No `code`: UserNotFoundException vs NotAuthorizedException would undo the
    // shared message above. The client only reads `error`.
    return NextResponse.json({ error: message }, { status });
  }
}
