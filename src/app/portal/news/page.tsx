import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ArticleWorkspace from "@/components/portal/publishing/ArticleWorkspace";

export const metadata: Metadata = { title: "News" };

export default function Page() {
  return (
    <RoleGate href="/portal/news">
      <ArticleWorkspace kind="news" />
    </RoleGate>
  );
}
