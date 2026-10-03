"use client";

import { useEffect, useState } from "react";
import { RECRUITING_ROLES } from "@/lib/auth/config";

export interface StaffMember {
  /** Cognito sub: what task assignees and session ids are keyed on. */
  sub: string;
  name: string;
  email: string;
  role: string;
}

const RECRUITING = new Set<string>(RECRUITING_ROLES);

/** Active teammates who can work candidates (media excluded). Empty on failure. */
export function useStaffUsers(): { users: StaffMember[]; loading: boolean } {
  const [users, setUsers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d: { users?: Array<{ sub?: string; name?: string; email?: string; role?: string | null; status?: string }> }) => {
        if (cancelled) return;
        const list = (d.users || [])
          .filter((u) => u.sub && u.status === "active" && u.role && RECRUITING.has(u.role))
          .map((u) => ({ sub: u.sub!, name: u.name || u.email || "Unnamed", email: u.email || "", role: u.role! }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setUsers(list);
      })
      .catch(() => { /* assignee falls back to "me" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { users, loading };
}
