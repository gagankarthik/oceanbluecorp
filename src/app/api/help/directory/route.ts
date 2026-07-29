import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getContentBlock, upsertContentBlock } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

/**
 * Help directory CMS. The team/contacts list on /admin/help is stored as a
 * single content block so ADMIN or HR can edit it without a code change.
 * `fields.members` holds the JSON array; any staff can READ it, only admin/HR
 * may WRITE.
 */
const BLOCK_ID = "help-directory";

// GET — the stored members (empty array if never edited; the page falls back to
// its built-in defaults in that case). Any signed-in staff member may read.
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
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
    console.error("Error fetching help directory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — replace the directory. ADMIN or HR only.
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  if (!auth.claims.groups.some((g) => g === "admin" || g === "hr")) {
    return NextResponse.json({ error: "Only Admin or HR can edit the help directory." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!Array.isArray(body.members)) {
      return NextResponse.json({ error: "members must be an array" }, { status: 400 });
    }
    // Persist only the known fields — never trust arbitrary keys off the wire.
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
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    try { revalidatePath("/admin/help"); } catch { /* best-effort */ }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving help directory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
