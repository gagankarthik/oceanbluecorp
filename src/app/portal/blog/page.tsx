import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ArticleWorkspace from "@/components/portal/publishing/ArticleWorkspace";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return (
    <RoleGate href="/portal/blog">
      <ArticleWorkspace kind="blog" />
    </RoleGate>
  );
}
