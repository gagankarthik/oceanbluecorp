"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserManager } from "@/lib/auth/AuthContext";
import { Loader2, LogOut, AlertCircle } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSignOut, setAutoSignOut] = useState(false);

  useEffect(() => {
    // Check if this is an automatic sign-out request (e.g., from session expiry)
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "true") {
      setAutoSignOut(true);
      handleSignOut();
    }
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userManager = getUserManager();

      // Clear local OIDC session only — Cognito session is already cleared
      // when AuthContext.signOut() redirected through the Cognito /logout endpoint.
      // Do NOT call Cognito /logout again here or it will loop / return "Invalid request".
      await userManager.removeUser();

      // Clear all oidc-related keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("oidc.")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      router.push("/auth/signin");
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign out");
      setIsLoading(false);
    }
  };

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
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-500">Signing you out...</p>
            </div>
          ) : (
            /* Action Buttons */
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>

              {!autoSignOut && (
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}