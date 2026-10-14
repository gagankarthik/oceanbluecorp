import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ArticleWorkspace from "@/components/portal/publishing/ArticleWorkspace";

export const metadata: Metadata = { title: "Customer Stories" };

export default function Page() {
  return (
    <RoleGate href="/portal/customer-stories">
      <ArticleWorkspace kind="customer-story" />
    </RoleGate>
  );
}
