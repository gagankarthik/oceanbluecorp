import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import SecurityPage from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/security",
  title: "Security",
  description: "How Oceanblue Solutions, Inc. protects client and candidate data: encryption, access controls, where data is stored, and how to report a vulnerability.",
});

export default function Security() {
  return <SecurityPage />;
}
