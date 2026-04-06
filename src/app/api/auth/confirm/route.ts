import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and confirmation code are required." }, { status: 400 });
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    await client.send(
      new ConfirmSignUpCommand({
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? "";
    const messages: Record<string, string> = {
      CodeMismatchException: "Invalid confirmation code.",
      ExpiredCodeException: "Code has expired. Please request a new one.",
      NotAuthorizedException: "This account is already confirmed.",
    };
    return NextResponse.json(
      { error: messages[name] ?? "Confirmation failed. Please try again.", code: name },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    await client.send(
      new ResendConfirmationCodeCommand({
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Username: email,
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? "";
    return NextResponse.json(
      { error: "Failed to resend code. Please try again.", code: name },
      { status: 400 }
    );
  }
}
