"use client";

import { useEffect, useState } from "react";
import { highestStaffRole, type UserRole } from "@/lib/auth/config";
import { clearLegacyHrPortalCookies } from "@/lib/auth/hrPortalSession";

// Read-only view of the staff session for public pages, so they skip AuthProvider
// (oidc-client-ts). Reads the record UserManager stores under `oidc.user:*`.

export type StaffSessionUser = { id: string; email: string; name: string; role: UserRole | null };

function readStoredUser(): StaffSessionUser | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("oidc.user:")) continue;
      const raw = JSON.parse(localStorage.getItem(key) || "null") as {
        expires_at?: number;
        profile?: Record<string, unknown>;
      } | null;
      if (!raw?.profile) continue;
      if (raw.expires_at && raw.expires_at * 1000 <= Date.now()) continue;
      const p = raw.profile;
      const role = highestStaffRole((p["cognito:groups"] as string[]) || []);
      if (!role) continue;
      const email = (p.email as string) || "";
      return { id: (p.sub as string) || "", email, name: (p.name as string) || email || "User", role };
    }
  } catch {
    // Storage blocked: treat as signed out.
  }
  return null;
}

export function useStaffSession() {
  const [user, setUser] = useState<StaffSessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    setIsLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("oidc.")) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { user, isAuthenticated: !!user, isLoading };
}

// Mirrors AuthContext.signOut without loading UserManager.
export async function signOutStaff() {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // Non-fatal.
  }
  clearLegacyHrPortalCookies();
  try {
    for (const store of [localStorage, sessionStorage]) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k?.startsWith("oidc.")) keys.push(k);
      }
      keys.forEach((k) => store.removeItem(k));
    }
  } catch {
    // Non-fatal.
  }
  window.location.replace("/");
}
