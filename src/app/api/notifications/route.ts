import { NextRequest, NextResponse } from "next/server";
import { getAllNotifications, markNotificationsReadForUser } from "@/lib/aws/dynamodb";
import { requireSignedIn, type Claims } from "@/lib/auth/verify";
import { notificationsFor } from "@/lib/notifications";
import { validate, validationMessage } from "@/lib/validate";

const MAX_LIMIT = 100;

// Per-user state is keyed on the token's sub; without one there is nobody to act for.
const noSubject = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

async function visibleTo(claims: Claims) {
  const result = await getAllNotifications();
  if (!result.success) return null;
  return notificationsFor(result.data ?? [], { userId: claims.sub, groups: claims.groups });
}

// GET /api/notifications?limit=&unread=true — the caller's notifications only.
export async function GET(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  if (!auth.claims.sub) return noSubject();

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  let limit: number | undefined;
  if (limitParam !== null) {
    limit = Number(limitParam);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return NextResponse.json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}` }, { status: 400 });
    }
  }
  const unreadOnly = searchParams.get("unread") === "true";

  try {
    const visible = await visibleTo(auth.claims);
    if (!visible) return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });

    const unreadCount = visible.filter((n) => !n.isRead).length;
    const list = unreadOnly ? visible.filter((n) => !n.isRead) : visible;
    return NextResponse.json({
      notifications: limit ? list.slice(0, limit) : list,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

async function markAllReadForCaller(claims: Claims) {
  try {
    const visible = await visibleTo(claims);
    if (!visible) return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });

    const unreadIds = visible.filter((n) => !n.isRead).map((n) => n.id);
    const result = await markNotificationsReadForUser(unreadIds, claims.sub);
    if (!result.success) {
      console.error("Error marking notifications read:", result.error);
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
    return NextResponse.json({ message: "All notifications marked as read", updated: result.data?.updated ?? 0 });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

const PATCH_SCHEMA = { action: { kind: "string" as const, required: true, oneOf: ["read_all"] } };

// PATCH /api/notifications { action: "read_all" } — marks read for the caller only.
export async function PATCH(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  if (!auth.claims.sub) return noSubject();

  const raw = await request.json().catch(() => null);
  const checked = validate(raw, PATCH_SCHEMA);
  if (!checked.ok) return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });

  return markAllReadForCaller(auth.claims);
}

// PUT /api/notifications — legacy alias for read_all.
export async function PUT(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  if (!auth.claims.sub) return noSubject();
  return markAllReadForCaller(auth.claims);
}
