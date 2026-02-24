import { NextRequest, NextResponse } from "next/server";
import { listCognitoUsers } from "@/lib/aws/cognito";

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const nextToken = searchParams.get("nextToken");

    const result = await listCognitoUsers({
      limit: limit ? parseInt(limit) : 60,
      paginationToken: nextToken || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch users" },
        { status: 500 }
      );
    }

    let users = result.users || [];

    // Filter by role if specified
    if (role && role !== "all") {
      users = users.filter((user) => user.role === role);
    }

    // Filter by status if specified
    if (status && status !== "all") {
      users = users.filter((user) => user.status === status);
    }

    // Sort by createdAt descending (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      users,
      nextToken: result.nextToken,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
