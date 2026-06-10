"use client";

import * as React from "react";
import { useAuth, UserRole, roleHierarchy } from "@/lib/auth";

/**
 * In-content role gating. Route-level guarding stays in ProtectedRoute /
 * the nav's roles arrays; RoleGate handles the finer grain — buttons,
 * table columns, card sections — so pages stop sprinkling ad-hoc
 * `user?.role === …` checks.
 *
 * Convention (see DESIGN_SYSTEM.md):
 *  - mode="hide" (default): the viewer's role will NEVER need it → remove it.
 *    Use for admin-only sections shown to recruiters, etc.
 *  - mode="disable": the action exists for the role but is currently not
 *    permitted (or needs escalation) → render children inside a wrapper
 *    with reduced opacity and no pointer events, preserving layout.
 *    Prefer pairing with a Tooltip explaining why.
 *
 * RoleGate only shapes the UI. Every mutation must still be authorized
 * server-side in the API route — never rely on hidden buttons for security.
 */
export function RoleGate({
  roles,
  minimum,
  mode = "hide",
  fallback = null,
  children,
}: {
  /** Allowed roles (exact match against the viewer's role). */
  roles?: UserRole[];
  /** Alternative: allow this role and anything above it in the hierarchy. */
  minimum?: UserRole;
  mode?: "hide" | "disable";
  /** Rendered instead of children when hidden (e.g. an upgrade hint). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const allowed = useCan({ roles, minimum });
  if (allowed) return <>{children}</>;
  if (mode === "disable") {
    return (
      <div aria-disabled className="pointer-events-none select-none opacity-50">
        {children}
      </div>
    );
  }
  return <>{fallback}</>;
}

/** Hook form for conditional logic (column lists, menu items, redirects). */
export function useCan({ roles, minimum }: { roles?: UserRole[]; minimum?: UserRole }): boolean {
  const { user } = useAuth();
  if (!user?.role) return false;
  if (roles && roles.includes(user.role)) return true;
  if (minimum && roleHierarchy[user.role] >= roleHierarchy[minimum]) return true;
  return !roles && !minimum;
}
