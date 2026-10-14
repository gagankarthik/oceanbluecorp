import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ResumesView from "./View";

export const metadata: Metadata = { title: "Resumes" };

export default function ResumesPage() {
  return (
    <RoleGate href="/portal/resumes">
      <ResumesView />
    </RoleGate>
  );
}
