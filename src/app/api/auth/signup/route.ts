import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { NextResponse } from "next/server";

const cognitoErrorMessages: Record<string, string> = {
  UsernameExistsException: "An account with this email already exists.",
  InvalidPasswordException: "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
  InvalidParameterException: "Please check your input and try again.",
  TooManyRequestsException: "Too many attempts. Please try again later.",
};

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: "Name, email, phone, and password are required." }, { status: 400 });
    }

    const client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
    });

    const command = new SignUpCommand({
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "phone_number", Value: phone }, // must be E.164 e.g. +12025551234
      ],
    });

    await client.send(command);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const name = (err as { name?: string }).name ?? "";
    const message = cognitoErrorMessages[name] ?? "Sign up failed. Please try again.";
    const status = name === "UsernameExistsException" ? 409 : 400;
    return NextResponse.json({ error: message, code: name }, { status });
  }
}
