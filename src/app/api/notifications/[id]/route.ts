import { NextRequest, NextResponse } from "next/server";
import {
  getNotification,
  markNotificationReadForUser,
  dismissNotificationForUser,
  deleteNotification,
} from "@/lib/aws/dynamodb";
import { requireAdmin, requireSignedIn, type Claims } from "@/lib/auth/verify";
import { canSeeNotificationType } from "@/lib/notifications";
import { staffRolesOf } from "@/lib/auth/config";
import { validate, validationMessage } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const badId = () => NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
const notFound = () => NextResponse.json({ error: "Notification not found" }, { status: 404 });

type Action = "read" | "dismiss";

// Acts for the caller only. A notification outside their roles answers 404, same
// as a missing one, so ids from another role's feed reveal nothing.
async function actForCaller(id: string, action: Action, claims: Claims) {
  if (!claims.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const found = await getNotification(id);
    if (!found.success) {
      console.error("Error loading notification:", found.error);
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
    if (!found.data || !canSeeNotificationType(found.data.type, staffRolesOf(claims.groups))) return notFound();

    const result = action === "read"
      ? await markNotificationReadForUser(id, claims.sub)
      : await dismissNotificationForUser(id, claims.sub);
    if (!result.success) {
      if (result.error === "Notification not found") return notFound();
      console.error(`Error applying notification ${action}:`, result.error);
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
    return NextResponse.json({ message: action === "read" ? "Notification marked as read" : "Notification dismissed" });
  } catch (error) {
    console.error(`Error applying notification ${action}:`, error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

const PATCH_SCHEMA = { action: { kind: "string" as const, required: true, oneOf: ["read", "dismiss"] } };

// PATCH /api/notifications/[id] { action: "read" | "dismiss" }
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!ID_RE.test(id)) return badId();

  const raw = await request.json().catch(() => null);
  const checked = validate<{ action: Action }>(raw, PATCH_SCHEMA);
  if (!checked.ok) return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });

  return actForCaller(id, checked.value.action, auth.claims);
}

// PUT /api/notifications/[id] — legacy alias for { action: "read" }.
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!ID_RE.test(id)) return badId();

  return actForCaller(id, "read", auth.claims);
}

// DELETE /api/notifications/[id] — removes it for everyone, so admins only.
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!ID_RE.test(id)) return badId();

  try {
    const result = await deleteNotification(id);
    if (!result.success) {
      console.error("Error deleting notification:", result.error);
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }
    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
