import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  type RespondToAuthChallengeCommandOutput,
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

// Attributes this form can supply when the pool demands them alongside the new
// password. Anything else the pool requires has to be set at invite time.
const supportedAttributes = ["name", "phone_number"] as const;

interface Challenge {
  session: string;
  username: string;
}

// A challenge session is single-use: the moment Cognito rejects an answer the
// session dies with it, so every follow-up attempt reports "session expired"
// instead of the real problem. Re-running InitiateAuth with the temporary
// password mints a fresh one, that is what makes any second attempt, ours or
// the user's, possible at all.
async function reissueChallenge(
  client: CognitoIdentityProviderClient,
  email: string,
  tempPassword: string
): Promise<Challenge | null> {
  try {
    const response = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: tempPassword },
      })
    );

    if (response.ChallengeName !== "NEW_PASSWORD_REQUIRED" || !response.Session) {
      return null;
    }

    return {
      session: response.Session,
      username: response.ChallengeParameters?.USER_ID_FOR_SRP || email,
    };
  } catch (err) {
    // The temp password is gone or no longer valid, nothing to recover with.
    console.error("Could not re-issue the invite challenge:", err);
    return null;
  }
}

// POST /api/auth/complete-invite
// Answers the Cognito NEW_PASSWORD_REQUIRED challenge raised on an invited
// user's first sign-in: sets the permanent password, then stores their full
// name and phone number on the account.
export async function POST(request: Request) {
  try {
    const {
      email, session, name, phone, password, username, requiredAttributes, tempPassword,
    } = await request.json();

    if (!email || !name || !phone || !password) {
      return NextResponse.json(
        { error: "Name, phone, and a new password are required." },
        { status: 400 }
      );
    }

    if (!session && !tempPassword) {
      return NextResponse.json(
        { error: "Your invite session has expired. Please sign in again to restart." },
        { status: 400 }
      );
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    // The invite only sets `email`, so any other attribute the pool marks
    // required is still missing, and Cognito refuses the challenge until it
    // travels with the new password. Sign-in reports which ones; without that
    // list, send both the form collects.
    const values: Record<string, string> = { name, phone_number: phone };
    const candidates: string[] =
      Array.isArray(requiredAttributes) && requiredAttributes.length > 0
        ? requiredAttributes.map(String)
        : [...supportedAttributes];
    const wanted = candidates.filter((attr) => attr in values);

    const attributeResponses = Object.fromEntries(
      wanted.map((attr) => [`userAttributes.${attr}`, values[attr]])
    );

    const respond = (challenge: Challenge, extra: Record<string, string>) =>
      client.send(
        new RespondToAuthChallengeCommand({
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
          Session: challenge.session,
          ChallengeResponses: {
            // Cognito issues the session against this identifier, for pools
            // with UUID usernames it is not the typed email.
            USERNAME: challenge.username,
            NEW_PASSWORD: password,
            ...extra,
          },
        })
      );

    // The session the sign-in step handed us may already be spent, by an
    // earlier failed attempt on this same form. Mint a new one when it is
    // missing entirely; otherwise try it and fall back below.
    let challenge: Challenge | null = session
      ? { session, username: username || email }
      : await reissueChallenge(client, email, tempPassword);

    if (!challenge) {
      return NextResponse.json(
        { error: "Your invite session has expired. Please sign in again to restart." },
        { status: 400 }
      );
    }

    let response: RespondToAuthChallengeCommandOutput;
    try {
      response = await respond(challenge, attributeResponses);
    } catch (err: unknown) {
      const code = (err as { name?: string }).name ?? "";
      // A password the pool refuses will be refused again, no fresh session
      // changes that, so don't spend one hiding a message the user needs.
      if (code === "InvalidPasswordException" || !tempPassword) throw err;

      console.error("Challenge answer failed, retrying on a fresh session:", err);

      // Whatever went wrong, the session is now spent. Re-issue, then answer
      // with the password alone: if the app client simply isn't allowed to
      // write name/phone, that was the failure, and the admin-credentialed
      // update below sets them anyway.
      const fresh = await reissueChallenge(client, email, tempPassword);
      if (!fresh) throw err;
      challenge = fresh;
      try {
        response = await respond(fresh, {});
      } catch {
        // The password-only answer tells us nothing new, surface the original.
        throw err;
      }
    }

    const result = response.AuthenticationResult;

    if (!result?.AccessToken || !result?.IdToken) {
      return NextResponse.json(
        { error: "Could not complete your account setup. Please sign in again." },
        { status: 400 }
      );
    }

    // Resolve the account's `sub` from the freshly issued IdToken, a reliable
    // identifier for the admin attribute update regardless of how the pool maps
    // usernames vs. the email alias.
    let usernameForUpdate = challenge.username;
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
    // failure here shouldn't block the user from getting in, log and continue.
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
    console.error("Invite completion failed:", err);
    const name = (err as { name?: string }).name ?? "";
    const message = cognitoErrorMessages[name] ?? "Could not complete your account setup. Please try again.";
    // Cognito's own wording ("Attributes did not conform to the schema…") is
    // what makes a rejected setup diagnosable, pass it through as a detail.
    const detail = (err as { message?: string }).message;
    return NextResponse.json({ error: message, code: name, detail }, { status: 400 });
  }
}
