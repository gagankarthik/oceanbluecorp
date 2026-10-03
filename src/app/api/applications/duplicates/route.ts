import { NextRequest, NextResponse } from "next/server";
import { getApplicationsByEmail, getApplicationsByName } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";
import { visibleTo } from "@/lib/aws/application-access";
import { serverError } from "@/lib/api-errors";
import type { DuplicateMatch } from "@/lib/application-input";

/**
 * GET /api/applications/duplicates?email=&name=&exclude=
 * Existing candidates with the same email (case-insensitive) or the same full
 * name (ignoring case, accents and punctuation). Both go through an index.
 * Only what the warning needs is returned, and My Pool stays private.
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").slice(0, 254);
    const name = (searchParams.get("name") || "").slice(0, 200);
    const exclude = searchParams.get("exclude");

    const none: Awaited<ReturnType<typeof getApplicationsByEmail>> = { success: true, data: [] };
    const [byEmail, byName] = await Promise.all([
      email ? getApplicationsByEmail(email) : none,
      name ? getApplicationsByName(name) : none,
    ]);
    if (!byEmail.success || !byName.success) {
      return serverError("Checking duplicates", byEmail.error ?? byName.error, "Couldn't check for duplicates.");
    }

    const visible = visibleTo(auth.claims);
    const matches = new Map<string, DuplicateMatch>();
    const add = (list: typeof byEmail.data, on: "email" | "name") => {
      for (const a of list || []) {
        if (a.id === exclude || !visible(a)) continue;
        const m = matches.get(a.id) ?? {
          id: a.id, name: a.name, email: a.email, jobTitle: a.jobTitle, status: a.status, matchedOn: [],
        };
        if (!m.matchedOn.includes(on)) m.matchedOn.push(on);
        matches.set(a.id, m);
      }
    };
    add(byEmail.data, "email");
    add(byName.data, "name");

    // Email matches first: those are almost certainly the same person.
    const list = [...matches.values()].sort((x, y) => Number(y.matchedOn.includes("email")) - Number(x.matchedOn.includes("email")));
    return NextResponse.json({ matches: list.slice(0, 10) });
  } catch (error) {
    return serverError("Error checking duplicates", error, "Couldn't check for duplicates.");
  }
}
