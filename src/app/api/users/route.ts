import { NextRequest, NextResponse } from "next/server";
import { listCognitoUsers } from "@/lib/aws/cognito";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
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
      return serverError("Listing users", result.error, "Couldn't load the team. Please try again.");
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
    return serverError("Error fetching users", error, "Couldn't load the team. Please try again.");
  }
}
