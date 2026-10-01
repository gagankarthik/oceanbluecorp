"use client";

import { useEffect } from "react";
import { useAuth, UserRole } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  fallbackUrl = "/auth/signin",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination for redirect after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_redirect", pathname);
      }
      router.push(fallbackUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname, fallbackUrl]);

  if (isLoading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div aria-hidden="true" className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-cobalt border-t-transparent" />
          <p className="mt-4 text-[14px] text-ink-muted">Checking your sign-in…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role access
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-3 text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Your current role: <span className="font-semibold capitalize">{user?.role}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required roles: <span className="font-semibold capitalize">{requiredRoles.join(", ")}</span>
          </p>
          <div className="mt-6 space-x-4">
            <button
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
