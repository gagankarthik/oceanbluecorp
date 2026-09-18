import { NextRequest, NextResponse } from "next/server";
import { getAllApiKeys, createApiKey, ApiKey } from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth/verify";
import { scopesForLevel, scopesOf, accessLevelOf, DEFAULT_ACCESS_LEVEL } from "@/lib/api-scopes";
import { serverError } from "@/lib/api-errors";

function generateApiKey(): string {
  return "obk_live_" + crypto.randomBytes(32).toString("hex");
}

// GET /api/admin/api-keys - List all API keys
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await getAllApiKeys();
    if (!result.success) {
      return serverError("Listing API keys", result.error, "Couldn't load the API keys. Please try again.");
    }
    const keys = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // Never expose the raw key value in list responses. `scopes` is resolved
    // rather than passed through so a pre-scopes key reports read-only instead
    // of an empty list the screen would have to interpret for itself.
    const sanitized = keys.map(({ key: _key, ...rest }) => ({
      ...rest,
      keyPreview: _key.slice(0, 12) + "...",
      scopes: scopesOf(rest),
      accessLevel: accessLevelOf(rest),
    }));
    return NextResponse.json({ apiKeys: sanitized });
  } catch (error) {
    return serverError("Error listing API keys", error, "Couldn't load the API keys. Please try again.");
  }
}

// POST /api/admin/api-keys - Create a new API key
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const rawKey = generateApiKey();
    const apiKey: ApiKey = {
      id: uuidv4(),
      key: rawKey,
      name: body.name,
      description: body.description || "",
      // An unrecognised or missing level resolves to read-only. Issuing a key
      // with more power than was asked for is the failure that matters here.
      scopes: scopesForLevel(body.accessLevel ?? DEFAULT_ACCESS_LEVEL),
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy || "system",
      createdByName: body.createdByName,
    };

    const result = await createApiKey(apiKey);
    if (!result.success) {
      return serverError("Creating API key", result.error, "Couldn't create the API key. Please try again.");
    }

    // Return the full key only on creation, never shown again
    return NextResponse.json(
      { apiKey: { ...apiKey, accessLevel: accessLevelOf(apiKey) } },
      { status: 201 },
    );
  } catch (error) {
    return serverError("Error creating API key", error, "Couldn't create the API key. Please try again.");
  }
}
