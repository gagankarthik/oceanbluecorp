import { NextRequest, NextResponse } from "next/server";
import { getAllVendors, createVendor, Vendor } from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorLeadRole = searchParams.get("vendorLeadRole") as "hr" | "admin" | null;

    const result = await getAllVendors(vendorLeadRole || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch vendors" },
        { status: 500 }
      );
    }

    // Sort by createdAt descending (newest first)
    const vendors = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "vendorLeadId", "vendorLeadName", "vendorLeadRole"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate vendorLeadRole
    if (!["hr", "admin"].includes(body.vendorLeadRole)) {
      return NextResponse.json(
        { error: "Vendor Lead Role must be 'hr' or 'admin'" },
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

    const vendor: Vendor = {
      id: uuidv4(),
      name: body.name.trim(),
      contactPerson: body.contactPerson?.trim() || undefined,
      email: body.email?.trim() || undefined,
      zipCode: body.zipCode?.trim() || undefined,
      state: body.state?.trim() || undefined,
      vendorLeadId: body.vendorLeadId,
      vendorLeadName: body.vendorLeadName,
      vendorLeadRole: body.vendorLeadRole,
      createdAt: new Date().toISOString(),
    };

    const result = await createVendor(vendor);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create vendor" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Vendor created successfully", vendor },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
