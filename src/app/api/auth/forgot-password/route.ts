import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";

/* Step one of the reset: ask Cognito to email a verification code.
 *
 * The response is deliberately identical whether or not the address exists.
 * Returning "no account found" here would turn this endpoint into a way to
 * enumerate every staff email in the pool, which is worth more to an attacker
 * than the reset itself. The genuine errors we do surface are the ones the
 * person can act on: rate limiting, and an account that has never signed in. */

const messages: Record<string, string> = {
  LimitExceededException: "Too many attempts. Wait a few minutes and try again.",
  TooManyRequestsException: "Too many attempts. Wait a few minutes and try again.",
  InvalidParameterException:
    "This account has not been set up yet. Ask an administrator to re-send your invitation.",
  NotAuthorizedException:
    "This account cannot be reset from here. Contact an administrator.",
};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    await client.send(
      new ForgotPasswordCommand({
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Username: email,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";

    // Unknown address: answer exactly as if it had worked.
    if (name === "UserNotFoundException") {
      return NextResponse.json({ ok: true });
    }

    if (messages[name]) {
      return NextResponse.json({ error: messages[name] }, { status: 400 });
    }

    console.error("[oceanblue] forgot-password failed:", err);
    return NextResponse.json(
      { error: "Could not start the reset. Try again shortly." },
      { status: 500 }
    );
  }
}
