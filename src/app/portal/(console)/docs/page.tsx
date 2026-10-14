import type { Metadata } from "next";
import DocsView from "@/components/portal/workspace/DocsView";

export const metadata: Metadata = { title: "Developer docs" };

export default function DocsPage() {
  return <DocsView />;
}
