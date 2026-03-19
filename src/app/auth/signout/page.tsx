"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Loader2, LogOut, AlertCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo/Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
              <LogOut className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {autoSignOut ? "Session Ended" : "Sign Out"}
          </h1>

          <p className="text-gray-500 mb-8">
            {autoSignOut
              ? "Your session has expired. Signing you out..."
              : "Are you sure you want to sign out of your account?"}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading || authLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-500">
                {authLoading ? "Loading..." : "Signing you out..."}
              </p>
            </div>
          ) : (
            /* Action Buttons - Only show if not auto-signing out */
            !autoSignOut && (
              <div className="space-y-3">
                <button
                  onClick={handleSignOut}
                  disabled={isLoading || authLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isLoading || authLoading}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}