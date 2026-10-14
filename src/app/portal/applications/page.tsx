import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ApplicationsView from "./View";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <RoleGate href="/portal/applications">
      <ApplicationsView />
    </RoleGate>
  );
}
