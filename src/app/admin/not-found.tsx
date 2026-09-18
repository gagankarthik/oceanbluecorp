"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { useAuth, landingRouteFor } from "@/lib/auth";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { WorkspaceButton } from "@/components/admin/workspace";

// Rendered inside the admin shell, so the sidebar stays as the way out.
export default function AdminNotFound() {
  const { user } = useAuth();
  const home = landingRouteFor(user?.role);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <AdminCard className="w-full max-w-md">
        <EmptyState
          icon={SearchX}
          title="This page doesn't exist"
          description="The link may be out of date, or the record it pointed to was removed. Use the sidebar or go back to where you started."
          action={
            <WorkspaceButton variant="primary" asChild>
              <Link href={home}>{home === "/admin" ? "Back to dashboard" : "Go to your workspace"}</Link>
            </WorkspaceButton>
          }
        />
      </AdminCard>
    </div>
  );
}
