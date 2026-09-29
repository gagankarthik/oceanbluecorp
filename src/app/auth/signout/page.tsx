"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconAlert, IconLogout } from "@/components/site/icons";
import { AuthShell, StatusMark } from "../auth-shell";

export default function SignOutPage() {
  const router = useRouter();
  const { signOut, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSignOut, setAutoSignOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the signOut from auth context which handles everything properly
      await signOut();
      // Note: signOut() redirects to Cognito logout or home page,
      // so we only reach here if something goes wrong or on localhost
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign out");
      setIsLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    // Check if this is an automatic sign-out request (e.g., from session expiry)
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "true") {
      setAutoSignOut(true);
      handleSignOut();
    }
  }, [handleSignOut]);

  // If user is not authenticated and not loading, redirect to signin
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isLoading) {
      router.push("/auth/signin");
    }
  }, [authLoading, isAuthenticated, isLoading, router]);

  const handleCancel = () => {
    router.back();
  };

  const busy = isLoading || authLoading;

  return (
    <AuthShell
      title={autoSignOut ? "Session ended." : "Leaving the console."}
      body="Signing out ends this session on this device. You can sign back in at any time with the same account."
    >
      <div className="rise text-center" role="status" aria-live="polite">
        <StatusMark tone="neutral">
          <IconLogout size={28} />
        </StatusMark>
        <h1 className="mt-6 type-headline-sm text-ink">{autoSignOut ? "Your session has ended" : "Sign out?"}</h1>
        <p className="mt-2 type-body text-ink-muted">
          {autoSignOut ? "Your session expired, so we are signing you out." : "You will need to sign in again to use the console."}
        </p>

        {error && (
          <p className="mt-6 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-container px-4 py-3 text-left type-body-sm text-danger">
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {busy ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <span className="size-8 animate-spin rounded-full border-[3px] border-cobalt-tint border-t-cobalt" />
            <p className="type-body-sm text-ink-muted">{authLoading ? "Loading…" : "Signing you out…"}</p>
          </div>
        ) : (
          !autoSignOut && (
            <div className="mt-8 grid gap-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cobalt px-6 type-label text-white transition-colors duration-150 hover:bg-cobalt-deep"
              >
                <IconLogout size={18} />
                Sign out
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-line-strong bg-white px-6 type-label text-ink transition-colors duration-150 hover:border-cobalt hover:text-cobalt"
              >
                Stay signed in
              </button>
            </div>
          )
        )}
      </div>
    </AuthShell>
  );
}
