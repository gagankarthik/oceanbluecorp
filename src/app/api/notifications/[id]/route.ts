import { NextRequest, NextResponse } from "next/server";
import {
  markNotificationAsRead,
  deleteNotification,
} from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

// PUT /api/notifications/[id] - Mark a notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    const result = await markNotificationAsRead(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    const result = await deleteNotification(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
