import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import OpenRolesView from "./View";

export const metadata: Metadata = { title: "Open Roles" };

export default function OpenRolesPage() {
  return (
    <RoleGate href="/portal/open-roles">
      <OpenRolesView />
    </RoleGate>
  );
}
