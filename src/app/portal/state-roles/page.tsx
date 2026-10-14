import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import StateRolesView from "./View";

export const metadata: Metadata = { title: "State Roles" };

export default function StateRolesPage() {
  return (
    <RoleGate href="/portal/state-roles">
      <StateRolesView />
    </RoleGate>
  );
}
