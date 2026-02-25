import { NextRequest, NextResponse } from "next/server";
import { getVendor, updateVendor, deleteVendor, Vendor } from "@/lib/aws/dynamodb";

// GET /api/vendors/[id] - Get a single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getVendor(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch vendor" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor: result.data });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/vendors/[id] - Update vendor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if vendor exists
    const existingVendor = await getVendor(id);
    if (!existingVendor.success || !existingVendor.data) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Validate vendorLeadRole if provided
    if (body.vendorLeadRole && !["hr", "admin"].includes(body.vendorLeadRole)) {
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

    const updates: Partial<Omit<Vendor, "id" | "createdAt">> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.contactPerson !== undefined) updates.contactPerson = body.contactPerson?.trim() || undefined;
    if (body.email !== undefined) updates.email = body.email?.trim() || undefined;
    if (body.zipCode !== undefined) updates.zipCode = body.zipCode?.trim() || undefined;
    if (body.state !== undefined) updates.state = body.state?.trim() || undefined;
    if (body.vendorLeadId !== undefined) updates.vendorLeadId = body.vendorLeadId;
    if (body.vendorLeadName !== undefined) updates.vendorLeadName = body.vendorLeadName;
    if (body.vendorLeadRole !== undefined) updates.vendorLeadRole = body.vendorLeadRole;

    const result = await updateVendor(id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update vendor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Vendor updated successfully" });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if vendor exists
    const existingVendor = await getVendor(id);
    if (!existingVendor.success || !existingVendor.data) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const result = await deleteVendor(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete vendor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
