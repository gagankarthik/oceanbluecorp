import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import TeamPage from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/team",
  title: "Leadership Team",
  description: "Meet the leadership behind Ocean Blue Corporation, senior practitioners in IT staffing, enterprise solutions, and managed services.",
});

export default function Team() {
  return <TeamPage />;
}
