import { NextRequest, NextResponse } from "next/server";
import { getAllClients, createClient, Client } from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Client["status"] | null;

    const result = await getAllClients(status || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch clients" },
        { status: 500 }
      );
    }

    // Sort by createdAt descending (newest first)
    const clients = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "websiteUrl", "status"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate status
    if (!["active", "inactive"].includes(body.status)) {
      return NextResponse.json(
        { error: "Status must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Validate website URL format
    try {
      new URL(body.websiteUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid website URL format" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    const client: Client = {
      id: uuidv4(),
      name: body.name.trim(),
      websiteUrl: body.websiteUrl.trim(),
      status: body.status,
      email: body.email?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      address: body.address?.trim() || undefined,
      city: body.city?.trim() || undefined,
      state: body.state?.trim() || undefined,
      zipCode: body.zipCode?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const result = await createClient(client);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create client" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Client created successfully", client },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
