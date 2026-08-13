import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";

/* Step two: exchange the emailed code plus a new password for a reset.
 *
 * Unlike step one, these errors are safe to be specific about. The person is
 * already holding a code sent to an address they control, so telling them the
 * code was wrong or expired leaks nothing and is the only way they can fix it. */

const messages: Record<string, string> = {
  CodeMismatchException: "That code is not right. Check the email and try again.",
  ExpiredCodeException: "That code has expired. Request a new one.",
  // Same wording as the invite flow: the pool's policy is 8 characters with an
  // uppercase, a lowercase, a number and a symbol, so saying only "8
  // characters" here would send people round the same loop.
  InvalidPasswordException:
    "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
  LimitExceededException: "Too many attempts. Wait a few minutes and try again.",
  TooManyFailedAttemptsException: "Too many attempts. Request a new code.",
  UserNotFoundException: "That code is not right. Check the email and try again.",
};

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      return NextResponse.json(
        { error: "Enter the code from your email and a new password." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Your new password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    await client.send(
      new ConfirmForgotPasswordCommand({
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: String(code).trim(),
        Password: password,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";

    if (messages[name]) {
      return NextResponse.json({ error: messages[name] }, { status: 400 });
    }

    console.error("[oceanblue] reset-password failed:", err);
    return NextResponse.json(
      { error: "Could not reset the password. Try again shortly." },
      { status: 500 }
    );
  }
}
