import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ArticleWorkspace from "@/components/portal/publishing/ArticleWorkspace";

export const metadata: Metadata = { title: "Case studies" };

export default function Page() {
  return (
    <RoleGate href="/portal/case-studies">
      <ArticleWorkspace kind="case-study" />
    </RoleGate>
  );
}
