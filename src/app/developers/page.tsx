import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import DevelopersContent from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/developers",
  title: "Developers, Job Feed API",
  description: "Integrate Oceanblue Solutions, Inc.'s live job feed into your platform. REST API with API key authentication, pull active job listings in real time.",
});

export default function DevelopersPage() {
  return <DevelopersContent />;
}
