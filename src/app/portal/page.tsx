import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGate } from "@/components/portal/session";
import { DashboardPageSkeleton } from "./DashboardSkeleton";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function PortalHome() {
  return (
    <RoleGate href="/portal">
      <Suspense fallback={<DashboardPageSkeleton />}>
        <Dashboard />
      </Suspense>
    </RoleGate>
  );
}
