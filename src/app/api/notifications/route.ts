import { NextRequest, NextResponse } from "next/server";
import {
  getAllNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  Notification,
} from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/notifications - Get all notifications or unread only
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let result;

    if (unreadOnly) {
      result = await getUnreadNotifications();
    } else {
      result = await getAllNotifications(limit);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: result.data || [],
      unreadCount: (result.data || []).filter((n: Notification) => !n.isRead).length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark all notifications as read
export async function PUT(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await markAllNotificationsAsRead();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
