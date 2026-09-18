import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getContentBlock, upsertContentBlock } from "@/lib/aws/dynamodb";
import { requireSignedIn, requireUserAdmin } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

/**
 * Help directory CMS. The team/contacts list on /admin/help is stored as a
 * single content block so ADMIN or HR can edit it without a code change.
 * `fields.members` holds the JSON array; any staff can READ it, only admin/HR
 * may WRITE.
 */
const BLOCK_ID = "help-directory";

// GET, the stored members (empty array if never edited; the page falls back to
// its built-in defaults in that case). Any signed-in staff member may read.
export async function GET(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await getContentBlock(BLOCK_ID);
    const raw = result.data?.fields?.members;
    let members: unknown[] = [];
    if (raw) {
      try { members = JSON.parse(raw); } catch { members = []; }
    }
    return NextResponse.json({ members, updatedAt: result.data?.updatedAt ?? null });
  } catch (error) {
    return serverError("Error fetching help directory", error, "Couldn't load the help directory. Please try again.");
  }
}

// PUT, replace the directory. ADMIN or HR only.
export async function PUT(request: NextRequest) {
  // requireUserAdmin resolves namespaced groups; the literal "admin"/"hr" test
  // it replaces never matched `web:admin`, so current accounts got a 403.
  const auth = await requireUserAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    if (!Array.isArray(body.members) || body.members.length > 500) {
      return NextResponse.json({ error: "members must be a list of at most 500" }, { status: 400 });
    }
    // Persist only the known fields, never trust arbitrary keys off the wire.
    const members = body.members.map((m: Record<string, unknown>) => ({
      name: String(m.name ?? "").slice(0, 120),
      designation: String(m.designation ?? "").slice(0, 120),
      email: String(m.email ?? "").slice(0, 160),
      phone: String(m.phone ?? "").slice(0, 40),
      team: String(m.team ?? "").slice(0, 40),
    }));

    const result = await upsertContentBlock(
      BLOCK_ID,
      { members: JSON.stringify(members) },
      auth.claims.sub,
      typeof body.updatedByName === "string" ? body.updatedByName : undefined,
    );
    if (!result.success) {
      return serverError("Error saving help directory", result.error, "Couldn't save the help directory. Please try again.");
    }

    try { revalidatePath("/admin/help"); } catch { /* best-effort */ }
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Error saving help directory", error, "Couldn't save the help directory. Please try again.");
  }
}
