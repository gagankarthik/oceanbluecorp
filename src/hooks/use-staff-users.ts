"use client";

import { useMemo } from "react";
import { RECRUITING_ROLES } from "@/lib/auth/config";
import { useUserDirectory } from "./use-console-data";

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
  const { users: all, isLoading } = useUserDirectory();
  const users = useMemo(
    () => (all || [])
      .filter((u) => u.sub && u.status === "active" && u.role && RECRUITING.has(u.role))
      .map((u) => ({ sub: u.sub!, name: u.name || u.email || "Unnamed", email: u.email || "", role: u.role! }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [all],
  );
  return { users, loading: isLoading };
}
