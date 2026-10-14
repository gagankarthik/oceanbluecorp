"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import AuthShell from "../AuthShell";
import { Glyph, Mark } from "../status-mark";

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
      router.push("/auth/sign-in");
    }
  }, [authLoading, isAuthenticated, isLoading, router]);

  const handleCancel = () => {
    router.back();
  };

  const busy = isLoading || authLoading;

  return (
    <AuthShell>
      <div role="status" aria-live="polite">
        <Mark tone="neutral">
          <Glyph name="logout" />
        </Mark>
        <h1 className="display mt-6 text-head-md">{autoSignOut ? "Your session has ended" : "Sign out?"}</h1>
        <p className="mt-2 text-mist-600">
          {autoSignOut ? "Your session expired, so we are signing you out." : "You will need to sign in again to use the console."}
        </p>

        {error && (
          <p className="mt-6 flex items-start gap-3 bg-buoy-300/30 px-4 py-3 text-small text-navy-900">
            <Glyph name="alert" className="mt-0.5 size-[18px] shrink-0" />
            {error}
          </p>
        )}

        {busy ? (
          <div className="mt-8 flex items-center gap-3">
            <span className="size-6 animate-spin rounded-full border-[3px] border-mist-200 border-t-ocean-600" />
            <p className="text-small text-mist-600">{authLoading ? "Loading…" : "Signing you out…"}</p>
          </div>
        ) : (
          !autoSignOut && (
            <div className="mt-8 grid gap-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-12 w-full items-center justify-center gap-2 bg-ocean-600 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.99]"
              >
                <Glyph name="logout" className="size-[18px]" />
                Sign out
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex min-h-12 w-full items-center justify-center font-medium text-navy-900 ring-2 ring-inset ring-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
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
