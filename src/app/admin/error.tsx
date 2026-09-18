"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth, landingRouteFor } from "@/lib/auth";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { WorkspaceButton } from "@/components/admin/workspace";

// Catches render errors below the admin layout, so the shell survives.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { user } = useAuth();
  const home = landingRouteFor(user?.role);

  useEffect(() => {
    console.error("[admin] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <AdminCard className="w-full max-w-md">
        <EmptyState
          variant="error"
          title="Something went wrong on this page"
          description="It's a problem on our side, not something you did. Try again, and if it keeps happening, send the reference below to an administrator."
          action={
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                <WorkspaceButton variant="primary" onClick={reset}>Try again</WorkspaceButton>
                <WorkspaceButton asChild>
                  <Link href={home}>{home === "/admin" ? "Back to dashboard" : "Go to your workspace"}</Link>
                </WorkspaceButton>
              </div>
              {error.digest && (
                <p className="font-mono text-[12px] text-[var(--adm-ink-subtle)]">Reference: {error.digest}</p>
              )}
            </div>
          }
        />
      </AdminCard>
    </div>
  );
}
