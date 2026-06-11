import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/verify";
import { analyzeApplicationResume } from "@/lib/aws/analyze-application";
import { getApplication } from "@/lib/aws/dynamodb";

// The extraction Lambda's multi-agent pipeline can take 30–90s. Give the route
// room to wait (Amplify/Next maps this onto the underlying Lambda timeout).
export const maxDuration = 120;
export const dynamic = "force-dynamic";

// POST /api/applications/[id]/analyze — run resume analysis and store the result.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const result = await analyzeApplicationResume(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }

  // Return the updated application so the client can render immediately.
  const updated = await getApplication(id);
  return NextResponse.json({ success: true, application: updated.data });
}
