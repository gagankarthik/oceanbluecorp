"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import { canAccess, navItems, type PortalUser, type Role } from "@/lib/portal/roles";
import { NoAccess } from "./ui";

/** The signed-in Cognito user, in the portal's shape. */
type Ctx = {
  user: PortalUser;
  role: Role;
  /** The signed-in user's own role, whatever is being previewed. */
  realRole: Role;
  /** Admins can preview the portal as another role; the server still checks the real one. */
  setRole: (r: Role) => void;
  signOut: () => void;
};

const SessionContext = createContext<Ctx | null>(null);

// Cognito "media" is the portal's marketing role.
const ROLE_MAP: Record<string, Role> = { admin: "admin", hr: "hr", recruiter: "recruiter", sales: "sales", media: "marketing" };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const [preview, setPreview] = useState<Role | null>(null);
  const realRole = auth.user?.role ? ROLE_MAP[auth.user.role] : undefined;

  useEffect(() => {
    if (!auth.isLoading && (!auth.isAuthenticated || !realRole)) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.isLoading, auth.isAuthenticated, realRole, router, pathname]);

  // Media has no dashboard; only the bare /portal landing bounces.
  useEffect(() => {
    const home = landingRouteFor(auth.user?.role);
    if (pathname === "/portal" && realRole && home !== "/portal") router.replace(home);
  }, [pathname, realRole, auth.user?.role, router]);

  const setRole = useCallback((r: Role) => {
    if (realRole === "admin") setPreview(r === "admin" ? null : r);
  }, [realRole]);

  const { signOut: authSignOut } = auth;
  const signOut = useCallback(() => {
    void authSignOut().finally(() => router.replace("/auth/sign-in"));
  }, [authSignOut, router]);

  if (auth.isLoading || !auth.user || !realRole) {
    return (
      <div className="grid min-h-svh place-items-center bg-mist-50">
        <div className="flex items-center gap-3 text-adm-base text-mist-600">
          <span className="size-5 animate-spin rounded-full border-2 border-ocean-200 border-t-ocean-600" />
          Loading your workspace
        </div>
      </div>
    );
  }

  const user: PortalUser = {
    id: auth.user.id,
    name: auth.user.name || auth.user.email,
    email: auth.user.email,
    role: realRole,
    title: realRole === "marketing" ? "Media" : realRole[0].toUpperCase() + realRole.slice(1),
    status: "Active",
    lastActive: "Just now",
  };
  return (
    <SessionContext.Provider value={{ user, role: preview ?? realRole, realRole, setRole, signOut }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** Shows the page only to roles allowed to see it */
export function RoleGate({ href, children }: { href: string; children: React.ReactNode }) {
  const { role } = useSession();
  if (!canAccess(role, href)) {
    const label = navItems.find((i) => i.href === href)?.label ?? "this section";
    return <NoAccess section={label} />;
  }
  return <>{children}</>;
}
