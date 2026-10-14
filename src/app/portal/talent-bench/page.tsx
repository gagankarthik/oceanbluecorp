import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import TalentBenchView from "./View";

export const metadata: Metadata = { title: "Talent Bench" };

export default function TalentBenchPage() {
  return (
    <RoleGate href="/portal/talent-bench">
      <TalentBenchView />
    </RoleGate>
  );
}
