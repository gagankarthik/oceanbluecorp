import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllContentBlocks, upsertContentBlock } from "@/lib/aws/dynamodb";
import { requireAdmin } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

// Admin only, both ways. The public site reads blocks server-side through
// lib/content.ts, so the only callers here are /admin/content and the settings
// maintenance toggle, both admin screens. GET was open and returned every
// block, including `help-directory` (staff names and numbers that
// /api/help/directory keeps behind sign-in); PUT took any recruiting role,
// which let a recruiter rewrite homepage copy or take the site offline.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await getAllContentBlocks();
    if (!result.success) {
      return serverError("Error fetching content", result.error, "Couldn't load the site content. Please try again.");
    }
    return NextResponse.json({ blocks: result.data || [] });
  } catch (error) {
    return serverError("Error fetching content", error, "Couldn't load the site content. Please try again.");
  }
}

const MAX_ID = 100;
const MAX_FIELDS = 200;
const MAX_VALUE = 100_000; // the whole item must stay under DynamoDB's 400KB

// PUT /api/content, upsert a content block
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json().catch(() => null);
    const id = body?.id;
    const fields = body?.fields;

    if (typeof id !== "string" || !id.trim() || id.length > MAX_ID) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return NextResponse.json({ error: "fields must be an object" }, { status: 400 });
    }
    const entries = Object.entries(fields as Record<string, unknown>);
    if (entries.length > MAX_FIELDS) {
      return NextResponse.json({ error: `fields may hold at most ${MAX_FIELDS} entries` }, { status: 400 });
    }
    const clean: Record<string, string> = {};
    for (const [key, value] of entries) {
      if (typeof value !== "string") {
        return NextResponse.json({ error: `fields.${key} must be text` }, { status: 400 });
      }
      if (value.length > MAX_VALUE) {
        return NextResponse.json({ error: `fields.${key} is too long` }, { status: 400 });
      }
      clean[key] = value;
    }

    // Attribution from the verified token, never the body.
    const result = await upsertContentBlock(id, clean, auth.claims.sub, auth.claims.email);
    if (!result.success) {
      return serverError("Error saving content", result.error, "Couldn't save the site content. Please try again.");
    }

    // Push the edit live immediately: clear the cached announcement and
    // re-render the layout + content pages (so removing the announcement,
    // or any CMS copy, reflects on the site right away, not after 60s).
    try {
      revalidatePath("/", "layout");
    } catch {
      // revalidation is best-effort; the 60s ISR window is the fallback
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error saving content", error, "Couldn't save the site content. Please try again.");
  }
}
