import { NextRequest, NextResponse } from "next/server";
import { sendApplicationConfirmation } from "@/lib/aws/ses";

// GET /api/test-email?to=your@email.com - Test email configuration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("to");

  if (!testEmail) {
    return NextResponse.json(
      { error: "Please provide email address: /api/test-email?to=your@email.com" },
      { status: 400 }
    );
  }

  console.log("[TEST-EMAIL] Starting email test...");
  console.log(`[TEST-EMAIL] Target email: ${testEmail}`);
  console.log(`[TEST-EMAIL] SMTP User: ${process.env.NEXT_AWS_STMP ? "Configured" : "NOT SET"}`);
  console.log(`[TEST-EMAIL] SMTP Pass: ${process.env.NEXT_AWS_STMP_PASSWORD ? "Configured" : "NOT SET"}`);
  console.log(`[TEST-EMAIL] From Email: ${process.env.NEXT_AWS_SES_FROM_EMAIL || "noreply@oceanbluecorp.com"}`);
  console.log(`[TEST-EMAIL] Region: ${process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2"}`);

  try {
    const result = await sendApplicationConfirmation({
      candidateName: "Test User",
      candidateEmail: testEmail,
      jobTitle: "Test Position",
      jobDepartment: "Engineering",
      jobLocation: "Remote",
    });

    console.log("[TEST-EMAIL] Result:", result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        config: {
          smtpUser: process.env.NEXT_AWS_STMP ? "SET" : "NOT SET",
          smtpPass: process.env.NEXT_AWS_STMP_PASSWORD ? "SET" : "NOT SET",
          fromEmail: process.env.NEXT_AWS_SES_FROM_EMAIL || "noreply@oceanbluecorp.com",
          region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
        },
      });
    }
  } catch (error) {
    console.error("[TEST-EMAIL] Exception:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
