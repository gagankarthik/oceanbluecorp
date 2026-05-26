import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllContentBlocks, upsertContentBlock } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/content — fetch all content blocks
export async function GET() {
  try {
    const result = await getAllContentBlocks();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ blocks: result.data || [] });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/content — upsert a content block
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { id, fields, updatedBy, updatedByName } = body;

    if (!id || typeof fields !== "object") {
      return NextResponse.json({ error: "id and fields are required" }, { status: 400 });
    }

    const result = await upsertContentBlock(id, fields, updatedBy, updatedByName);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Push the edit live immediately: clear the cached announcement and
    // re-render the layout + content pages (so removing the announcement —
    // or any CMS copy — reflects on the site right away, not after 60s).
    try {
      revalidatePath("/", "layout");
    } catch {
      // revalidation is best-effort; the 60s ISR window is the fallback
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
